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
        include: { artist: true }
    });

    // Extract Artist ID
    let spotifyId = null;

    // Priority 1: Linked Artist Profile
    if (user?.artist?.spotifyUrl) {
        const rawUrl = user.artist.spotifyUrl;
        const parts = rawUrl.split('/').filter(p => p.trim() !== '');
        const lastPart = parts.pop() || '';
        spotifyId = lastPart.split('?')[0];
    }
    // Priority 2: User-provided Spotify URL in settings (Legacy / Unlinked)
    else if (user?.spotifyUrl) {
        const rawUrl = user.spotifyUrl;
        const parts = rawUrl.split('/').filter(p => p.trim() !== '');
        const lastPart = parts.pop() || '';
        spotifyId = lastPart.split('?')[0];
    }

    try {
        // Build OR conditions
        const orConditions = [
            { contracts: { some: { userId: session.user.id } } }
        ];

        if (spotifyId) {
            orConditions.push({ artistsJson: { contains: spotifyId } });
        }

        const releases = await prisma.release.findMany({
            where: {
                OR: orConditions
            },
            orderBy: { releaseDate: 'desc' },
            include: { requests: true }
        });

        return new Response(JSON.stringify(releases), { status: 200 });
    } catch (e) {
        console.error("Fetch Releases Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
