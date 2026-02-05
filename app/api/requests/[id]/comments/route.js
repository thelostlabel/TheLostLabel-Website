import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
            select: { userId: true }
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

        // Trigger notifications if needed
        // (Staff gets notified of artist comment, Artist gets notified of staff comment)

        return new Response(JSON.stringify(comment), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
