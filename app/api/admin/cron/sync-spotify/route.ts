import { NextRequest } from "next/server";
import { getArtistsDetails } from "@/lib/spotify";
import prisma from "@/lib/prisma";
import { scrapeSpotifyStats } from "@/lib/scraper";
import { hasValidCronAuthorization } from "@/lib/cron-auth";
import { enqueueSyncJob, scheduleSyncJobRunner, SYNC_JOB_TYPES } from "@/lib/sync-jobs";
import type { SpotifyArtist } from "@/types/spotify";

interface ScraperStats {
    monthlyListeners?: number;
    followers?: number;
    verified?: boolean;
    imageUrl?: string;
}

interface SyncResult {
    total: number;
    success: number;
    failed: number;
    details: Array<{ id: string; name: string; error: string }>;
}

/**
 * GET /api/admin/cron/sync-spotify
 * Periodic task to update monthly listeners for all curated artists.
 * Usage: curl -H "Authorization: Bearer YOUR_CRON_SECRET" -X GET "http://localhost:3000/api/admin/cron/sync-spotify"
 */
export async function GET(req: NextRequest): Promise<Response> {
    if (!process.env.CRON_SECRET) {
        return new Response(JSON.stringify({ error: "CRON_SECRET is not configured" }), { status: 500 });
    }

    // Security check
    if (!hasValidCronAuthorization(req)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const shouldQueue = searchParams.get('queue') !== 'false';

        if (shouldQueue) {
            const job = await enqueueSyncJob({
                type: SYNC_JOB_TYPES.artistStatsSync,
                dedupeKey: "artist_stats_sync"
            });
            void scheduleSyncJobRunner();

            return new Response(JSON.stringify({
                success: true,
                queued: true,
                jobId: job.id,
                status: job.status
            }), { status: 202 });
        }

        console.log("[Cron Sync] Starting Spotify sync for all artists...");

        // 1. Fetch all artists with a valid Spotify URL
        const artists = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null },
                status: 'active'
            }
        });

        console.log(`[Cron Sync] Found ${artists.length} artists to sync.`);

        const results: SyncResult = {
            total: artists.length,
            success: 0,
            failed: 0,
            details: []
        };

        // 2. Iterate and Scrape
        for (const artist of artists) {
            try {
                const spotifyId = artist.spotifyUrl!.split('/').filter(Boolean).pop()?.split('?')[0];
                console.log(`[Cron Sync] Syncing ${artist.name} (${spotifyId})...`);

                // Fetch from Scraper (Monthly Listeners)
                const stats = await scrapeSpotifyStats(artist.spotifyUrl!) as ScraperStats | null;

                // Fetch from API (Followers, Popularity, Images)
                let apiData: SpotifyArtist | null = null;
                if (spotifyId) {
                    const apiDetails = await getArtistsDetails([spotifyId]);
                    apiData = apiDetails?.[0] ?? null;
                }

                if (stats || apiData) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            monthlyListeners: stats?.monthlyListeners ?? artist.monthlyListeners,
                            followers: apiData?.followers?.total ?? stats?.followers ?? artist.followers,
                            verified: stats?.verified ?? artist.verified,
                            image: apiData?.images?.[0]?.url ?? stats?.imageUrl ?? artist.image,
                            lastSyncedAt: new Date()
                        }
                    });
                    results.success++;
                } else {
                    results.failed++;
                    results.details.push({ id: artist.id, name: artist.name, error: "No data found via scraper or API" });
                }

                // Small delay to be polite
                await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 1000));
            } catch (err: unknown) {
                console.error(`[Cron Sync] Error syncing ${artist.name}:`, err instanceof Error ? err.message : "Unknown error");
                results.failed++;
                results.details.push({ id: artist.id, name: artist.name, error: err instanceof Error ? err.message : "Unknown error" });
            }
        }

        console.log(`[Cron Sync] Finished! Success: ${results.success}, Failed: ${results.failed}`);

        return new Response(JSON.stringify({
            success: true,
            results
        }), { status: 200 });
    } catch (error: unknown) {
        console.error("[Cron Sync] Critical error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
