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
        // Fetch ALL artists (or just those needing update)
        // For now, let's process all artists with a Spotify URL
        const artists = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null }
            },
            select: { id: true, name: true, spotifyUrl: true }
        });

        // We will return immediately and process in background to avoid timeout
        // But since Vercel serverless has limits, this might be tricky.
        // For a small number of artists (e.g. < 50), we can try to do it sequentially or in chunks.
        // Given the use case, let's try to process them one by one and return the results.
        // If it times out, we might need a different strategy (e.g. task queue).

        console.log(`[Batch Scrape] Starting sync for ${artists.length} artists...`);

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

        return new Response(JSON.stringify({
            success: true,
            total: artists.length,
            successCount,
            failCount,
            results
        }), { status: 200 });

    } catch (error) {
        console.error("[Batch Scrape] Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
