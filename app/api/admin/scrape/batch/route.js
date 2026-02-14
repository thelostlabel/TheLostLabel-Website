import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeSpotifyStats } from "@/lib/scraper";

// POST: Trigger batch scrape for all artists
export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const requestedLimit = parseInt(searchParams.get('limit') || '20', 10);
        const requestedOffset = parseInt(searchParams.get('offset') || '0', 10);

        const limit = Number.isFinite(requestedLimit)
            ? Math.max(1, Math.min(requestedLimit, 50))
            : 20;
        const offset = Number.isFinite(requestedOffset)
            ? Math.max(0, requestedOffset)
            : 0;

        // Fetch ALL artists (or just those needing update)
        // For now, let's process all artists with a Spotify URL
        const [artists, totalArtists] = await Promise.all([
            prisma.artist.findMany({
                where: {
                    spotifyUrl: { not: null }
                },
                select: { id: true, name: true, spotifyUrl: true },
                orderBy: { updatedAt: 'asc' },
                skip: offset,
                take: limit
            }),
            prisma.artist.count({
                where: {
                    spotifyUrl: { not: null }
                }
            })
        ]);

        // We will return immediately and process in background to avoid timeout
        // But since Vercel serverless has limits, this might be tricky.
        // For a small number of artists (e.g. < 50), we can try to do it sequentially or in chunks.
        // Given the use case, let's try to process them one by one and return the results.
        // If it times out, we might need a different strategy (e.g. task queue).

        console.log(`[Batch Scrape] Starting sync for ${artists.length} artists (offset=${offset}, limit=${limit}, total=${totalArtists})...`);

        let successCount = 0;
        let failCount = 0;
        const results = [];

        for (const artist of artists) {
            try {
                if (!artist.spotifyUrl) continue;

                console.log(`[Batch Scrape] Syncing ${artist.name}...`);
                const stats = await scrapeSpotifyStats(artist.spotifyUrl);

                if (stats && stats.monthlyListeners !== null) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            monthlyListeners: stats.monthlyListeners,
                            // verified: stats.verified, // Optional update
                            lastSyncedAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                    successCount++;
                    results.push({ name: artist.name, status: 'success', listeners: stats.monthlyListeners });
                } else {
                    failCount++;
                    results.push({ name: artist.name, status: 'failed', reason: 'No data' });
                }

                // Small delay to be polite to Spotify
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`[Batch Scrape] Error syncing ${artist.name}:`, err);
                failCount++;
                results.push({ name: artist.name, status: 'error', error: err.message });
            }
        }

        const nextOffset = offset + artists.length;
        const hasMore = nextOffset < totalArtists;

        return new Response(JSON.stringify({
            success: true,
            total: artists.length,
            successCount,
            failCount,
            pagination: {
                totalArtists,
                limit,
                offset,
                nextOffset,
                hasMore
            },
            results
        }), { status: 200 });

    } catch (error) {
        console.error("[Batch Scrape] Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
