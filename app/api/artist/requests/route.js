import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { releaseId, type, details } = body;

        // Verify System Settings (optional: check if request type is enabled)
        const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
        if (settings) {
            const config = JSON.parse(settings.config);
            // e.g. if type is 'cover_art' and config.allowCoverArt is false
            if (type === 'cover_art' && config.allowCoverArt === false) {
                return new Response(JSON.stringify({ error: "This request type is currently disabled by admin." }), { status: 403 });
            }
        }

        const request = await prisma.changeRequest.create({
            data: {
                type,
                details,
                status: 'pending',
                releaseId,
                userId: session.user.id
            }
        });

        // Send Email Confirmation
        // Send Email Confirmation
        const { sendMail } = await import('@/lib/mail');

        // 1. Notify Artist (Confirmation)
        await sendMail({
            to: session.user.email,
            subject: 'Change Request Received - LOST. A&R Portal',
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Request Received</h2>
                    <p>Hello <strong>${session.user.stageName || 'Artist'}</strong>,</p>
                    <p>We've received your request for <strong>${type.toUpperCase().replace('_', ' ')}</strong>.</p>
                    <p><strong>Details:</strong> ${details}</p>
                    <p>Our team will review this shortly. You can track the status in your dashboard.</p>
                    <br>
                    <p>Best,<br>LOST. Team</p>
                </div>
            `
        });

        // 2. Notify Admin (if configured)
        if (settings) {
            const config = JSON.parse(settings.config);
            if (config.adminEmail) {
                await sendMail({
                    to: config.adminEmail,
                    subject: `New Request: ${type.toUpperCase()} from ${session.user.stageName || session.user.email}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>New Artist Request</h2>
                            <p><strong>Artist:</strong> ${session.user.stageName || 'Unknown'} (${session.user.email})</p>
                            <p><strong>Type:</strong> ${type.toUpperCase().replace('_', ' ')}</p>
                            <p><strong>Details:</strong> ${details}</p>
                            <br>
                            <a href="${process.env.NEXTAUTH_URL}/dashboard?view=requests">View in Admin Panel</a>
                        </div>
                    `
                });
            }
        }

        return new Response(JSON.stringify(request), { status: 201 });
    } catch (e) {
        console.error("Create Request Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        // 1. Get user's Spotify ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { spotifyUrl: true }
        });

        let spotifyId = null;
        if (user?.spotifyUrl) {
            spotifyId = user.spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];
        }

        // 2. Find requests
        // - Requests created by user
        // - OR Requests for releases where user is a collaborator (matching spotifyId in artistsJson)
        const requests = await prisma.changeRequest.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    spotifyId ? {
                        release: {
                            artistsJson: { contains: spotifyId }
                        }
                    } : {}
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: { release: true }
        });

        return new Response(JSON.stringify(requests), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
