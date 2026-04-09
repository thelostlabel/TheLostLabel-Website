import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeSpotifyStats } from "@/lib/scraper";

export async function POST(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        // 1. Find artists who need syncing
        // Criteria: Has Spotify URL AND (lastSyncedAt is null OR lastSyncedAt is older than 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const artistsToSync = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null },
                OR: [
                    { lastSyncedAt: null },
                    { lastSyncedAt: { lt: twentyFourHoursAgo } }
                ]
            },
            take: 10 // Process in chunks to avoid timeouts (client can call repeatedly or we use a queue in future)
        });

        if (artistsToSync.length === 0) {
            return new Response(JSON.stringify({ message: "All artists are up to date", count: 0 }), { status: 200 });
        }

        let updatedCount = 0;
        const results: Array<{ name: string; status: string; error?: string }> = [];

        // 2. Process each artist
        for (const artist of artistsToSync) {
            try {
                if (!artist.spotifyUrl) continue;

                console.log(`[Auto-Sync] Syncing ${artist.name} (${artist.spotifyUrl})...`);
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
                    updatedCount++;
                    results.push({ name: artist.name, status: 'success' });

                    // Add to history (upsert to avoid duplicates)
                    try {
                        // Normalize date to start of day
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        await prisma.artistStatsHistory.upsert({
                            where: {
                                artistId_date: {
                                    artistId: artist.id,
                                    date: today
                                }
                            },
                            update: {
                                monthlyListeners: stats.monthlyListeners,
                                followers: stats.followers || 0
                            },
                            create: {
                                artistId: artist.id,
                                monthlyListeners: stats.monthlyListeners,
                                followers: stats.followers || 0,
                                date: today
                            }
                        });
                    } catch (hErr: unknown) {
                        console.error(`[Auto-Sync] History fail for ${artist.name}:`, hErr instanceof Error ? hErr.message : "Unknown error");
                    }
                } else {
                    // Update lastSyncedAt anyway so we don't retry immediately?
                    // Or maybe wait 1 hour? Let's update to now to prevent infinite rapid loops on failure
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: { lastSyncedAt: new Date() } // Mark attempted
                    });
                    results.push({ name: artist.name, status: 'failed_no_data' });
                }
            } catch (e: unknown) {
                console.error(`[Auto-Sync] Failed for ${artist.name}:`, e);
                results.push({ name: artist.name, status: 'error', error: e instanceof Error ? e.message : "Unknown error" });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            count: updatedCount,
            totalAttempted: artistsToSync.length,
            details: results
        }), { status: 200 });

    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
