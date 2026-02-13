import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req) {
    try {
        const artists = await prisma.artist.findMany({
            where: {
                status: 'active',
                spotifyUrl: { not: null }
            },
            orderBy: {
                monthlyListeners: 'desc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            artists: artists.map(a => ({
                id: a.id,
                name: a.name,
                image: a.image,
                spotify_url: a.spotifyUrl,
                followers: a.followers || 0,
                monthlyListeners: a.monthlyListeners || 0,
                genres: a.genres ? a.genres.split(',') : [],
                verified: a.verified || false,
                lastSyncedAt: a.lastSyncedAt
            }))
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        logger.error('Failed to fetch artists', error);
        return new Response(JSON.stringify({ error: "Failed to fetch artists" }), { status: 500 });
    }
}
