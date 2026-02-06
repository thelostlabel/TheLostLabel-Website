import { getArtistsDetails } from "@/lib/spotify";

/**
 * GET /api/admin/cron/sync-spotify
 * Periodic task to update monthly listeners for all curated artists.
 * Usage: curl -X GET "http://localhost:3000/api/admin/cron/sync-spotify?key=YOUR_CRON_SECRET"
 */
export async function GET(req) {
    // ... existing searchParams and key check ...
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Security check
    if (key !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        console.log("[Cron Sync] Starting Spotify sync for all artists...");

        // 1. Fetch all artists with a valid Spotify URL
        const artists = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null },
                status: 'active'
            }
        });

        console.log(`[Cron Sync] Found ${artists.length} artists to sync.`);

        const results = {
            total: artists.length,
            success: 0,
            failed: 0,
            details: []
        };

        // 2. Iterate and Scrape
        for (const artist of artists) {
            try {
                const spotifyId = artist.spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];
                console.log(`[Cron Sync] Syncing ${artist.name} (${spotifyId})...`);

                // Fetch from Scraper (Monthly Listeners)
                const stats = await scrapeSpotifyStats(artist.spotifyUrl);

                // Fetch from API (Followers, Popularity, Images)
                let apiData = null;
                if (spotifyId) {
                    const apiDetails = await getArtistsDetails([spotifyId]);
                    apiData = apiDetails?.[0];
                }

                if (stats || apiData) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            monthlyListeners: stats?.monthlyListeners || artist.monthlyListeners,
                            followers: apiData?.followers?.total || stats?.followers || artist.followers,
                            verified: stats?.verified || artist.verified,
                            image: apiData?.images?.[0]?.url || stats?.imageUrl || artist.image,
                            lastSyncedAt: new Date()
                        }
                    });
                    results.success++;
                } else {
                    results.failed++;
                    results.details.push({ id: artist.id, name: artist.name, error: "No data found via scraper or API" });
                }

                // Small delay to be polite
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error(`[Cron Sync] Error syncing ${artist.name}:`, err.message);
                results.failed++;
                results.details.push({ id: artist.id, name: artist.name, error: err.message });
            }
        }

        console.log(`[Cron Sync] Finished! Success: ${results.success}, Failed: ${results.failed}`);

        return new Response(JSON.stringify({
            success: true,
            results
        }), { status: 200 });
    } catch (error) {
        console.error("[Cron Sync] Critical error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
