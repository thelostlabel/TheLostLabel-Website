import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeMonthlyListeners } from "@/lib/scraper";

// This endpoint syncs monthly listeners for all artists with Spotify URLs
// Can be called manually or via cron job
export async function POST(req) {
    const session = await getServerSession(authOptions);

    // Allow cron job with secret OR admin access
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
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
                spotifyUrl: true
            }
        });

        console.log(`[Cron] Starting sync for ${artists.length} artists with Spotify URLs`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const artist of artists) {
            try {
                console.log(`[Cron] Scraping: ${artist.stageName || artist.id}`);
                const listeners = await scrapeMonthlyListeners(artist.spotifyUrl);

                if (listeners) {
                    await prisma.user.update({
                        where: { id: artist.id },
                        data: { monthlyListeners: listeners }
                    });
                    results.push({ id: artist.id, stageName: artist.stageName, listeners, success: true });
                    successCount++;
                } else {
                    results.push({ id: artist.id, stageName: artist.stageName, success: false, error: 'No data' });
                    errorCount++;
                }

                // Small delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
                console.error(`[Cron] Error for ${artist.stageName}:`, err.message);
                results.push({ id: artist.id, stageName: artist.stageName, success: false, error: err.message });
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
    } catch (error) {
        console.error("[Cron] Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// GET: Check last sync status
export async function GET(req) {
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
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
