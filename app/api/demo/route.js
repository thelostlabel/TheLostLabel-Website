import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyDemoSubmission } from "@/lib/discord";
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
