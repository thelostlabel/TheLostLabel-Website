import prisma from "@/lib/prisma";
import { scrapeSpotifyStats } from "@/lib/scraper";

// GET /api/cron/sync-artists
// Securely triggered by external cron services (Vercel Cron, GitHub Actions, etc.)
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('[Cron-Sync] CRON_SECRET is not configured.');
        return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), { status: 500 });
    }

    if (secret !== cronSecret) {
        console.warn('[Cron-Sync] Unauthorized attempt.');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        console.log('[Cron-Sync] Starting automated artist stats refresh...');

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const artistsToSync = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null },
                status: 'active',
                OR: [
                    { lastSyncedAt: null },
                    { lastSyncedAt: { lt: twentyFourHoursAgo } }
                ]
            },
            take: 10
        });

        if (artistsToSync.length === 0) {
            return new Response(JSON.stringify({ message: 'All artists are up to date', count: 0 }), { status: 200 });
        }

        let updatedCount = 0;
        const results = [];

        for (const artist of artistsToSync) {
            try {
                const stats = await scrapeSpotifyStats(artist.spotifyUrl);

                if (stats && stats.monthlyListeners !== null) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            monthlyListeners: stats.monthlyListeners,
                            followers: stats.followers || undefined,
                            verified: stats.verified || false,
                            image: stats.imageUrl || undefined,
                            lastSyncedAt: new Date()
                        }
                    });

                    await prisma.artistStatsHistory.create({
                        data: {
                            artistId: artist.id,
                            monthlyListeners: stats.monthlyListeners,
                            followers: stats.followers || 0,
                            date: new Date()
                        }
                    });

                    updatedCount++;
                    results.push({ name: artist.name, status: 'success' });
                } else {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: { lastSyncedAt: new Date() }
                    });
                    results.push({ name: artist.name, status: 'failed_no_data' });
                }
            } catch (err) {
                console.error(`[Cron-Sync] Error for ${artist.name}:`, err.message);
                results.push({ name: artist.name, status: 'error', error: err.message });
            }
        }

        console.log(`[Cron-Sync] Completed. ${updatedCount} artists updated.`);

        return new Response(JSON.stringify({
            success: true,
            updatedCount,
            totalAttempted: artistsToSync.length,
            details: results
        }), { status: 200 });
    } catch (error) {
        console.error('[Cron-Sync] Fatal Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
