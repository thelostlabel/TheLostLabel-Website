import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateSupportUpdateEmail } from "@/lib/mail-templates";

// GET: Fetch comments for a specific request
export async function GET(req, { params }) {
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
                    select: { artistsJson: true }
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
                select: { spotifyUrl: true }
            });

            let isCollaborator = false;
            if (user?.spotifyUrl && request.release?.artistsJson) {
                const spotifyId = user.spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];
                if (spotifyId && request.release.artistsJson.includes(spotifyId)) {
                    isCollaborator = true;
                }
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
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Add a new comment
export async function POST(req, { params }) {
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
            include: { user: true, release: true }
        });

        if (!request) {
            return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
        }

        const isAdmin = session.user.role === 'admin' || session.user.role === 'a&r';
        if (!isAdmin && request.userId !== session.user.id) {
            // Check if user is a collaborator on the associated release
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { spotifyUrl: true }
            });

            let isCollaborator = false;
            if (user?.spotifyUrl && request.release?.artistsJson) {
                const spotifyId = user.spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];
                if (spotifyId && request.release.artistsJson.includes(spotifyId)) {
                    isCollaborator = true;
                }
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
            try {
                await sendMail({
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
                });
            } catch (emailError) {
                console.error("Support Mail Notification Error:", emailError);
            }
        }

        // Artist gets notified of staff comment
        if (isAdmin && request.userId !== session.user.id) {
            try {
                await sendMail({
                    to: request.user.email,
                    subject: `Update on your ${request.type.toUpperCase().replace('_', ' ')} request`,
                    html: generateSupportUpdateEmail(
                        request.user.stageName || 'Artist',
                        id,
                        request.type,
                        content
                    )
                });
            } catch (emailError) {
                console.error("Email Notification Error:", emailError);
            }
        }

        return new Response(JSON.stringify(comment), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
