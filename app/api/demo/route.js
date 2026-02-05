import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyDemoSubmission } from "@/lib/discord";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { title, genre, trackLink, message, files = [] } = body;

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
            genre
        );

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
