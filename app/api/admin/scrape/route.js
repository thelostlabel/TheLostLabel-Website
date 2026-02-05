import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scrapeMonthlyListeners } from "@/lib/scraper";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { userId, spotifyUrl } = await req.json();

        if (!spotifyUrl) {
            return new Response(JSON.stringify({ error: "Missing Spotify URL" }), { status: 400 });
        }

        console.log(`[API Scrape] Request for user ${userId} with URL ${spotifyUrl}`);

        // 1. Scrape
        const listeners = await scrapeMonthlyListeners(spotifyUrl);

        if (listeners === null) {
            return new Response(JSON.stringify({ error: "Scraping failed. Spotify might be blocking or URL is invalid." }), { status: 500 });
        }

        // 2. Update DB
        // We might be syncing a registered User OR a Roster Artist
        // First, check if it's a roster artist by extracting Spotify ID from URL
        const spotifyId = spotifyUrl.split('/').filter(Boolean).pop()?.split('?')[0];

        let updatedUser = null;
        let updatedArtist = null;

        // Update User if userId provided
        if (userId) {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    monthlyListeners: listeners,
                    spotifyUrl: spotifyUrl,
                    updatedAt: new Date()
                }
            });
        }

        // Update Artist roster if exists
        if (spotifyId) {
            try {
                updatedArtist = await prisma.artist.update({
                    where: { id: spotifyId },
                    data: {
                        monthlyListeners: listeners,
                        spotifyUrl: spotifyUrl,
                        updatedAt: new Date()
                    }
                });
            } catch (e) {
                // Artist might not be in roster yet, which is fine
                console.log(`[API Scrape] Artist ${spotifyId} not in roster, skipping roster update.`);
            }
        }

        if (!updatedUser && !updatedArtist) {
            return new Response(JSON.stringify({ error: "Could not find artist or user to update." }), { status: 404 });
        }

        return new Response(JSON.stringify({
            success: true,
            monthlyListeners: listeners,
            user: updatedUser,
            artist: updatedArtist
        }), { status: 200 });
    } catch (error) {
        console.error("[API Scrape] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
