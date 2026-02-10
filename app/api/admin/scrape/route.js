import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getArtistsDetails } from "@/lib/spotify";
import { scrapeSpotifyStats } from "@/lib/scraper";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { userId, artistId, spotifyUrl } = await req.json();

        if (!spotifyUrl) {
            return new Response(JSON.stringify({ error: "Missing Spotify URL" }), { status: 400 });
        }

        const spotifyId = spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];

        // 1. Fetch Stats
        // Scraper for Monthly Listeners (since API doesn't provide it)
        const stats = await scrapeSpotifyStats(spotifyUrl);

        // Spotify API for Followers & Verification (Standard API is more reliable for these)
        let apiStats = null;
        if (spotifyId) {
            const apiDetails = await getArtistsDetails([spotifyId]);
            if (apiDetails && apiDetails[0]) {
                const artist = apiDetails[0];
                apiStats = {
                    followers: artist.followers?.total || 0,
                    popularity: artist.popularity,
                    imageUrl: artist.images?.[0]?.url,
                    name: artist.name
                };
            }
        }

        if (!stats && !apiStats) {
            return new Response(JSON.stringify({ error: "Sync failed. Data could not be retrieved." }), { status: 500 });
        }

        // Handle stats being a raw number (from our new scraper update) or an object
        const monthlyListeners = (typeof stats === 'number') ? stats : (stats?.monthlyListeners || 0);
        const followers = apiStats?.followers || stats?.followers || 0;
        const verified = stats?.verified || false; // Spotify API doesn't expose verified flag easily
        const imageUrl = apiStats?.imageUrl || stats?.imageUrl;

        // 2. Update DB
        let updatedUser = null;
        let updatedArtist = null;

        // Update User if userId provided
        if (userId) {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    monthlyListeners: monthlyListeners,
                    spotifyUrl: spotifyUrl,
                    updatedAt: new Date()
                }
            });
        }

        // Update Artist roster
        // Priority: 1. artistId (UUID), 2. spotifyId (Primary Key if it matches ID)
        if (artistId || spotifyId) {
            try {
                updatedArtist = await prisma.artist.update({
                    where: { id: artistId || spotifyId },
                    data: {
                        monthlyListeners: monthlyListeners,
                        followers: followers || 0,
                        verified: verified || false,
                        image: imageUrl || undefined,
                        spotifyUrl: spotifyUrl,
                        lastSyncedAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            } catch (e) {
                console.log(`[API Scrape] Artist ${artistId || spotifyId} update failed, trying search by URL.`);
                // Fallback: Find by Spotify URL if ID update failed
                try {
                    const artistByUrl = await prisma.artist.findFirst({
                        where: { spotifyUrl: { contains: spotifyId } }
                    });
                    if (artistByUrl) {
                        updatedArtist = await prisma.artist.update({
                            where: { id: artistByUrl.id },
                            data: {
                                monthlyListeners: monthlyListeners,
                                followers: followers || 0,
                                verified: verified || false,
                                image: imageUrl || undefined,
                                spotifyUrl: spotifyUrl,
                                lastSyncedAt: new Date(),
                                updatedAt: new Date()
                            }
                        });
                    }
                } catch (err) {
                    console.log(`[API Scrape] Fallback update failed:`, err.message);
                }
            }

            // 3. Save History Snapshot
            if (updatedArtist) {
                try {
                    await prisma.artistStatsHistory.create({
                        data: {
                            artistId: updatedArtist.id,
                            monthlyListeners: monthlyListeners,
                            followers: followers || 0,
                            date: new Date()
                        }
                    });
                } catch (historyError) {
                    console.error("[API Scrape] History creation failed:", historyError.message);
                }
            }
        }

        if (!updatedUser && !updatedArtist) {
            return new Response(JSON.stringify({ error: "Could not find artist or user to update." }), { status: 404 });
        }

        return new Response(JSON.stringify({
            success: true,
            monthlyListeners,
            followers,
            user: updatedUser,
            artist: updatedArtist
        }), { status: 200 });
    } catch (error) {
        console.error("[API Scrape] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
