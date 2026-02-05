import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch current user's profile
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                stageName: true,
                spotifyUrl: true,
                monthlyListeners: true,
                role: true,
                createdAt: true
            }
        });

        return new Response(JSON.stringify(user), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PATCH: Update current user's profile
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { fullName, stageName, spotifyUrl } = body;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fullName: fullName || undefined,
                stageName: stageName || undefined,
                spotifyUrl: spotifyUrl || undefined
            }
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
