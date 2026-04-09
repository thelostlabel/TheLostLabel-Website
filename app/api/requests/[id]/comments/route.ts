import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateSupportUpdateEmail } from "@/lib/mail-templates";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { settleSideEffects } from "@/lib/async-effects";
import { hasExactReleaseArtist } from "@/lib/release-artists";

function extractSpotifyArtistId(url: string | null | undefined): string | null {
    if (!url || typeof url !== "string") return null;
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts.pop() || '';
    const id = lastPart.split('?')[0]?.trim();
    return id || null;
}

// GET: Fetch comments for a specific request
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        // First check if the user has access to this request
        const request = await prisma.changeRequest.findUnique({
            where: { id },
            select: {
                userId: true,
                release: {
                    select: {
                        releaseArtists: {
                            select: { artistId: true }
                        }
                    }
                }
            }
        });

        if (!request) {
            return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
        }

        // Check access
        const isAdmin = session.user.role === 'admin' || session.user.role === 'a&r';

        if (!isAdmin && request.userId !== session.user.id) {
            // Check if user is a collaborator on the associated release
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    spotifyUrl: true,
                    artist: { select: { spotifyUrl: true } }
                }
            });

            let isCollaborator = false;
            if (user?.spotifyUrl || user?.artist?.spotifyUrl) {
                const spotifyId = extractSpotifyArtistId(user.artist?.spotifyUrl) || extractSpotifyArtistId(user.spotifyUrl);
                isCollaborator = hasExactReleaseArtist(request.release?.releaseArtists, spotifyId);
            }

            if (!isCollaborator) {
                return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
            }
        }

        const comments = await prisma.changeRequestComment.findMany({
            where: { requestId: id },
            include: {
                user: { select: { stageName: true, email: true, role: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        return new Response(JSON.stringify(comments), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// POST: Add a new comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@thelostlabel.com';
        const body = await req.json();
        const { content } = body;

        if (!content || content.trim() === '') {
            return new Response(JSON.stringify({ error: "Comment cannot be empty" }), { status: 400 });
        }

        // Check access
        const request = await prisma.changeRequest.findUnique({
            where: { id },
            include: {
                user: true,
                release: {
                    include: {
                        releaseArtists: {
                            select: { artistId: true }
                        }
                    }
                }
            }
        });

        if (!request) {
            return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
        }

        const isAdmin = session.user.role === 'admin' || session.user.role === 'a&r';
        if (!isAdmin && request.userId !== session.user.id) {
            // Check if user is a collaborator on the associated release
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    spotifyUrl: true,
                    artist: { select: { spotifyUrl: true } }
                }
            });

            let isCollaborator = false;
            if (user?.spotifyUrl || user?.artist?.spotifyUrl) {
                const spotifyId = extractSpotifyArtistId(user.artist?.spotifyUrl) || extractSpotifyArtistId(user.spotifyUrl);
                isCollaborator = hasExactReleaseArtist(request.release?.releaseArtists, spotifyId);
            }

            if (!isCollaborator) {
                return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
            }
        }

        const comment = await prisma.changeRequestComment.create({
            data: {
                requestId: id,
                userId: session.user.id,
                content
            },
            include: {
                user: { select: { stageName: true, email: true, role: true } }
            }
        });

        // Notify support mailbox when artist/collaborator comments
        if (!isAdmin) {
            await settleSideEffects([
                {
                    label: "support-mailbox-comment-notification",
                    run: () => sendMail({
                    to: supportEmail,
                    subject: `Support Ticket Reply from ${request.user?.stageName || request.user?.email || 'Artist'}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>Support Ticket Reply</h2>
                            <p><strong>Request ID:</strong> ${id}</p>
                            <p><strong>Artist:</strong> ${request.user?.stageName || 'Unknown'} (${request.user?.email || 'No email'})</p>
                            <p><strong>Type:</strong> ${request.type.toUpperCase().replace('_', ' ')}</p>
                            <p><strong>Message:</strong> ${content}</p>
                            <br>
                            <a href="${process.env.NEXTAUTH_URL}/dashboard?view=requests&id=${id}">View in Admin Panel</a>
                        </div>
                    `
                    }).catch((emailError) => {
                        console.error("Support Mail Notification Error:", emailError);
                    })
                }
            ], 5000);
        }

        // Artist gets notified of staff comment
        if (isAdmin && request.userId !== session.user.id) {
            await settleSideEffects([
                {
                    label: "artist-support-update-email",
                    run: () => sendMail({
                        to: request.user.email,
                        subject: `Update on your ${request.type.toUpperCase().replace('_', ' ')} request`,
                        html: generateSupportUpdateEmail(
                            request.user.stageName || 'Artist',
                            id,
                            request.type,
                            content
                        )
                    }).catch((emailError) => {
                        console.error("Email Notification Error:", emailError);
                    })
                },
                {
                    label: "artist-support-update-discord",
                    run: () => queueDiscordNotification(request.userId, DISCORD_NOTIFY_TYPES.SUPPORT_RESPONSE, {
                        artist: request.user.stageName || request.user.email || 'Artist',
                        type: request.type,
                        content,
                        requestId: id
                    }).catch((dmError) => {
                        console.error("Discord DM Notification Error (support reply):", dmError);
                    })
                }
            ], 5000);
        }

        return new Response(JSON.stringify(comment), { status: 201 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
