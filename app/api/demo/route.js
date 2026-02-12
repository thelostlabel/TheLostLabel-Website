import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyDemoSubmission } from "@/lib/discord";
import { sendMail } from "@/lib/mail";
import { generateDemoReceivedEmail } from "@/lib/mail-templates";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";

// Rate limiter: 5 demos per hour per user
const limiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const demoSchema = z.object({
    title: z.string().min(1).max(100),
    genre: z.string().min(1).max(50).optional(),
    trackLink: z.string().url().optional().or(z.literal('')),
    message: z.string().max(1000).optional(),
    files: z.array(z.object({
        filename: z.string(),
        filepath: z.string(),
        filesize: z.number()
    })).optional()
}).refine(data => data.trackLink || (data.files && data.files.length > 0), {
    message: "Either a track link or at least one file must be provided.",
    path: ["trackLink"]
});

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

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

        const demo = await prisma.demo.create({
            data: {
                title,
                genre,
                trackLink: trackLink || null,
                message,
                artist: {
                    connect: { id: session.user.id }
                },
                files: files.length > 0 ? {
                    create: files.map(f => ({
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

        // Send Discord notification
        await notifyDemoSubmission(
            session.user.stageName || session.user.email,
            title,
            genre,
            trackLink || null
        );

        // Send Email notification to Artist
        const userPrefs = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notifyDemos: true, email: true, stageName: true, fullName: true }
        });

        const artistName = userPrefs.stageName || userPrefs.fullName || "Artist";

        // 1. Send confirmation to Artist
        if (userPrefs?.notifyDemos) {
            try {
                await sendMail({
                    to: userPrefs.email,
                    subject: 'Demo Received | LOST.',
                    html: generateDemoReceivedEmail(artistName, title)
                });
            } catch (mailError) {
                console.error("Failed to send demo confirmation email:", mailError);
            }
        }

        // 2. Forward Demo to A&R Team
        try {
            const demoLinkHtml = trackLink
                ? `<p><strong>Link:</strong> <a href="${trackLink}">${trackLink}</a></p>`
                : `<p><strong>Files:</strong> ${files.length} file(s) attached in dashboard.</p>`;

            await sendMail({
                to: 'demo@thelostlabel.com',
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
        } catch (teamMailError) {
            console.error("Failed to forward demo to team:", teamMailError);
        }

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
        const isAdminOrAR = session.user.role === 'admin' || session.user.role === 'a&r';

        if (isAdminOrAR && !filterMine) {
            const demos = await prisma.demo.findMany({
                include: {
                    artist: {
                        select: { stageName: true, email: true }
                    },
                    files: true
                },
                orderBy: { createdAt: 'desc' }
            });
            return new Response(JSON.stringify(demos), { status: 200 });
        } else {
            const demos = await prisma.demo.findMany({
                where: { artistId: session.user.id },
                include: { files: true },
                orderBy: { createdAt: 'desc' }
            });
            return new Response(JSON.stringify(demos), { status: 200 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
