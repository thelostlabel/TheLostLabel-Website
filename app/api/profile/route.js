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
                createdAt: true,
                notifyDemos: true,
                notifyEarnings: true,
                notifySupport: true,
                notifyContracts: true
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
        const { fullName, stageName, spotifyUrl, notifyDemos, notifyEarnings, notifySupport, notifyContracts } = body;

        // Check if user is linked to an Artist profile
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { artist: true }
        });

        // Validation for linked artists
        if (user.artist && (stageName || spotifyUrl)) {
            // Check if they are actually trying to CHANGE it, not just sending the same value
            const isNameChanging = stageName && stageName !== user.stageName;
            const isUrlChanging = spotifyUrl && spotifyUrl !== user.spotifyUrl;

            if (isNameChanging || isUrlChanging) {
                return new Response(JSON.stringify({
                    error: "Once your profile is linked to an artist, Stage Name and Spotify URL can only be changed by support."
                }), { status: 403 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fullName: fullName || undefined,
                stageName: stageName || undefined,
                spotifyUrl: spotifyUrl || undefined,
                notifyDemos: notifyDemos !== undefined ? notifyDemos : undefined,
                notifyEarnings: notifyEarnings !== undefined ? notifyEarnings : undefined,
                notifySupport: notifySupport !== undefined ? notifySupport : undefined,
                notifyContracts: notifyContracts !== undefined ? notifyContracts : undefined
            }
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
