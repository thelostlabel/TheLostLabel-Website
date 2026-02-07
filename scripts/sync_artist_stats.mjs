import { PrismaClient } from '@prisma/client';
import { scrapeSpotifyStats } from '../lib/scraper.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING GLOBAL ARTIST STATS SYNC ---');

    try {
        // Fetch all artists with Spotify URLs
        const artists = await prisma.artist.findMany({
            where: {
                spotifyUrl: { not: null }
            }
        });

        console.log(`Found ${artists.length} artists to sync.`);

        for (const artist of artists) {
            console.log(`\n[${artist.name}] Processing...`);

            try {
                const stats = await scrapeSpotifyStats(artist.spotifyUrl);

                if (stats && stats.monthlyListeners) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            monthlyListeners: stats.monthlyListeners,
                            followers: stats.followers || artist.followers,
                            lastSyncedAt: new Date(),
                            // Also try to update user if linked
                            user: artist.userId ? {
                                update: {
                                    monthlyListeners: stats.monthlyListeners
                                }
                            } : undefined
                        }
                    });
                    console.log(`[${artist.name}] ✅ Success: ${stats.monthlyListeners.toLocaleString()} monthly listeners.`);
                } else {
                    console.log(`[${artist.name}] ⚠️ No listeners found in scrape.`);
                }
            } catch (e) {
                console.error(`[${artist.name}] ❌ Error:`, e.message);
            }

            // Small delay to avoid triggering bot detection
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error) {
        console.error('Critical Error in sync script:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n--- SYNC PROCESS COMPLETE ---');
    }
}

main();
