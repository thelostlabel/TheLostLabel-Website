import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Always get latest user profile from DB to avoid session sync issues
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { spotifyUrl: true, email: true }
    });

    if (!user || !user.spotifyUrl) {
        return new Response(JSON.stringify({ error: "Spotify URL not set" }), { status: 400 });
    }

    // Extract Artist ID
    const rawUrl = user.spotifyUrl;
    // Handle various URL formats and trailing slashes
    const parts = rawUrl.split('/').filter(p => p.trim() !== '');
    const lastPart = parts.pop() || '';
    const spotifyId = lastPart.split('?')[0];

    console.log("--- DEBUG ARTIST RELEASES ---");
    console.log("User Email:", user.email);
    console.log("Raw Spotify URL:", rawUrl);
    console.log("Extracted ID:", spotifyId);
    console.log("-----------------------------");

    try {
        // Find releases where artistsJson contains the ID.
        // artistsJson format: [{"id":"123","name":"..."}]
        const releases = await prisma.release.findMany({
            where: {
                artistsJson: { contains: spotifyId }
            },
            orderBy: { createdAt: 'desc' },
            include: { requests: true } // Include status of any open requests
        });

        return new Response(JSON.stringify(releases), { status: 200 });
    } catch (e) {
        console.error("Fetch Releases Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
