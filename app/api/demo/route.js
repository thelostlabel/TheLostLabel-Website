import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateDemoReceivedEmail } from "@/lib/mail-templates";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { settleSideEffects } from "@/lib/async-effects";
import { resolveArtistContextForUser } from "@/lib/artist-identity";

// Rate limiter: 10 demos per hour per user
const limiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const demoSchema = z.object({
    title: z.string().min(1).max(100),
    genre: z.string().max(50).optional().or(z.literal('')).or(z.null()),
    // URL is optional; users can submit only a link or only files.
    trackLink: z.string().trim().max(500).optional().or(z.literal('')).or(z.null()),
    message: z.string().max(1000).optional().or(z.literal('')).or(z.null()),
    files: z.array(z.object({
        filename: z.string(),
        filepath: z.string(),
        filesize: z.number()
    })).optional().or(z.null())
}).refine(data => {
    const hasLink = data.trackLink && data.trackLink.length > 5;
    const hasFiles = data.files && data.files.length > 0;
    return hasLink || hasFiles;
}, {
    message: "Either a track link or at least one file must be provided.",
    path: ["trackLink"]
});

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });
    if (!hasPortalPermission(session.user, "submit_demos")) {
        return new Response(JSON.stringify({ error: "You do not have permission to submit demos." }), { status: 403 });
    }

    try {
        await limiter.check(null, 10, session.user.id);
    } catch {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429 });
    }

    try {
        const body = await req.json();

        // Validate input
        const result = demoSchema.safeParse(body);
        if (!result.success) {
            return new Response(JSON.stringify({ error: "Invalid input", details: result.error.issues }), { status: 400 });
        }

    const { title, genre, trackLink, message, files = [] } = result.data;
        const sanitizedFiles = (files || []).filter((f) => {
            if (!f?.filepath || typeof f.filepath !== "string") return false;
            if (f.filepath.includes("..")) return false;
            // Only allow demo files that were written by /api/upload
            return /^private\/uploads\/demos\/[a-f0-9-]+_[A-Za-z0-9._-]+$/i.test(f.filepath);
        });

        if ((files || []).length > 0 && sanitizedFiles.length === 0 && !trackLink) {
            return new Response(JSON.stringify({ error: "Invalid uploaded file references." }), { status: 400 });
        }

        const artistContext = await resolveArtistContextForUser(session.user.id);

        const demo = await prisma.demo.create({
            data: {
                title,
                genre,
                trackLink: trackLink || null,
                message,
                artist: {
                    connect: { id: session.user.id }
                },
                ...(artistContext.artistId ? {
                    artistProfile: {
                        connect: { id: artistContext.artistId }
                    }
                } : {}),
                files: sanitizedFiles.length > 0 ? {
                    create: sanitizedFiles.map(f => ({
                        filename: f.filename,
                        filepath: f.filepath,
                        filesize: f.filesize
                    }))
                } : undefined
            },
            include: {
                files: true
            }
        });

        // Internal Discord bridge outbox (bot-driven delivery)
        try {
            await insertDiscordOutboxEvent(
                "demo_submitted",
                {
                    demoId: demo.id,
                    title: demo.title,
                    genre: demo.genre,
                    status: demo.status,
                    stageName: session.user.stageName || session.user.email,
                    source: "web"
                },
                demo.id
            );
        } catch (outboxError) {
            console.error("[Demo POST] Failed to enqueue Discord outbox event:", outboxError);
        }

        /* 
        // Send Discord notification
        await notifyDemoSubmission(
            session.user.stageName || session.user.email,
            title,
            genre,
            trackLink || null
        );
        */

        // Send Email notification to Artist
        const userPrefs = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notifyDemos: true, email: true, stageName: true, fullName: true }
        });

        const artistName = userPrefs.stageName || userPrefs.fullName || "Artist";

        // 1. Send confirmation to Artist (always, if email exists)
        await settleSideEffects([
            {
                label: "demo-confirmation-email",
                run: async () => {
                    if (!userPrefs?.email) return;
                    await sendMail({
                    to: userPrefs.email,
                    subject: 'Demo Received | LOST.',
                    html: generateDemoReceivedEmail(artistName, title)
                    });
                }
            },
            {
                label: "demo-team-forward-email",
                run: async () => {
                    const demoMailbox = process.env.DEMO_EMAIL || 'demo@thelostlabel.com';
                    const demoLinkHtml = trackLink
                        ? `<p><strong>Link:</strong> <a href="${trackLink}">${trackLink}</a></p>`
                        : `<p><strong>Files:</strong> ${files.length} file(s) attached in dashboard.</p>`;

                    await sendMail({
                        to: demoMailbox,
                        subject: `NEW DEMO: ${artistName} - ${title}`,
                        html: `
                            <h2>New Demo Submission</h2>
                            <p><strong>Artist:</strong> ${artistName}</p>
                            <p><strong>Title:</strong> ${title}</p>
                            <p><strong>Genre:</strong> ${genre || 'N/A'}</p>
                            ${demoLinkHtml}
                            <p><strong>Message:</strong><br/>${message || 'No message'}</p>
                            <hr/>
                            <p><a href="${process.env.NEXTAUTH_URL}/dashboard?view=submissions">View in Admin Panel</a></p>
                        `
                    });
                }
            }
        ], 5000).catch((sideEffectError) => {
            console.error("Demo notification side effects failed:", sideEffectError);
        });

        return new Response(JSON.stringify(demo), { status: 201 });
    } catch (error) {
        console.error("Demo Create Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const filterMine = searchParams.get('filter') === 'mine';
        const canViewAll = canViewAllDemos(session.user);
        const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });

        if (filterMine && !hasPortalPermission(session.user, "view_demos")) {
            return new Response(JSON.stringify({ error: "You do not have permission to view demos." }), { status: 403 });
        }

        if (canViewAll && !filterMine) {
            const [demos, total] = await Promise.all([
                prisma.demo.findMany({
                    include: {
                        artist: {
                            select: { stageName: true, email: true }
                        },
                        files: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.demo.count()
            ]);
            return new Response(JSON.stringify({
                demos,
                pagination: buildOffsetPaginationMeta(total, page, limit)
            }), { status: 200 });
        } else {
            if (!hasPortalPermission(session.user, "view_demos")) {
                return new Response(JSON.stringify({ error: "You do not have permission to view demos." }), { status: 403 });
            }

            const artistContext = await resolveArtistContextForUser(session.user.id);
            const where = {
                OR: [
                    { artistId: session.user.id },
                    ...(artistContext.artistId ? [{ artistProfileId: artistContext.artistId }] : [])
                ]
            };
            const [demos, total] = await Promise.all([
                prisma.demo.findMany({
                    where,
                    include: { files: true },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.demo.count({ where })
            ]);
            return new Response(JSON.stringify({
                demos,
                pagination: buildOffsetPaginationMeta(total, page, limit)
            }), { status: 200 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
