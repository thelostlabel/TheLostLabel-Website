import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeSpotifyStats } from "@/lib/scraper";
import { hasValidCronAuthorization } from "@/lib/cron-auth";

// This endpoint syncs monthly listeners for all artists with Spotify URLs
// Can be called manually or via cron job
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Allow authenticated cron job via Authorization header OR admin access
    const isValidCron = hasValidCronAuthorization(req);
    const isAdmin = session?.user?.role === 'admin';

    if (!isValidCron && !isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        // Get all artists with Spotify URLs
        const artists = await prisma.user.findMany({
            where: {
                spotifyUrl: { not: null }
            },
            select: {
                id: true,
                stageName: true,
                spotifyUrl: true,
                artist: {
                    select: { id: true }
                }
            }
        });

        console.log(`[Cron] Starting sync for ${artists.length} artists with Spotify URLs`);

        const results: Array<{ id: string; stageName: string | null; listeners?: number | null; success: boolean; error?: string }> = [];
        let successCount = 0;
        let errorCount = 0;

        for (const artistItem of artists) {
            try {
                console.log(`[Cron] Scraping: ${artistItem.stageName || artistItem.id}`);
                const data = await scrapeSpotifyStats(artistItem.spotifyUrl); // Assuming scraper returns object now

                const listeners = data?.monthlyListeners || null;

                if (listeners) {
                    // Update User
                    await prisma.user.update({
                        where: { id: artistItem.id },
                        data: {
                            monthlyListeners: listeners,
                            updatedAt: new Date()
                        }
                    });

                    // Update Artist profile if linked
                    if (artistItem.artist?.id) {
                        await prisma.artist.update({
                            where: { id: artistItem.artist.id },
                            data: {
                                monthlyListeners: listeners,
                                lastSyncedAt: new Date()
                            }
                        });
                    }

                    results.push({ id: artistItem.id, stageName: artistItem.stageName, listeners, success: true });
                    successCount++;
                } else {
                    results.push({ id: artistItem.id, stageName: artistItem.stageName, success: false, error: 'No data' });
                    errorCount++;
                }

                // Small delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            } catch (err: unknown) {
                const errMessage = err instanceof Error ? err.message : "Unknown error";
                console.error(`[Cron] Error for ${artistItem.stageName || artistItem.id}:`, errMessage);
                results.push({ id: artistItem.id, stageName: artistItem.stageName, success: false, error: errMessage });
                errorCount++;
            }
        }

        console.log(`[Cron] Sync complete. Success: ${successCount}, Errors: ${errorCount}`);

        return new Response(JSON.stringify({
            success: true,
            totalArtists: artists.length,
            successCount,
            errorCount,
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: unknown) {
        console.error("[Cron] Critical Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// GET: Check last sync status
export async function GET(req: NextRequest) {
    try {
        const artistsWithListeners = await prisma.user.count({
            where: { monthlyListeners: { not: null } }
        });
        const totalArtists = await prisma.user.count({
            where: { spotifyUrl: { not: null } }
        });

        return new Response(JSON.stringify({
            artistsWithData: artistsWithListeners,
            totalWithSpotify: totalArtists
        }), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
