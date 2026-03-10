import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById } from "@/lib/release-artists";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: "Artist ID required" }), { status: 400 });
    }

    try {
        let artistData = null;
        let isRoster = false;

        // 1. Try fetching from User table (Registered Artists)
        const userArtist = await prisma.user.findUnique({
            where: { id },
            include: {
                demos: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (userArtist) {
            artistData = userArtist;
        } else {
            // 2. Try fetching from Artist table (Roster Artists)
            const rosterArtist = await prisma.artist.findUnique({
                where: { id }
            });

            if (rosterArtist) {
                artistData = {
                    ...rosterArtist,
                    id: rosterArtist.id,
                    stageName: rosterArtist.name,
                    demos: []
                };
                isRoster = true;
            }
        }

        if (!artistData) {
            return new Response(JSON.stringify({ error: "Artist not found" }), { status: 404 });
        }

        let releases = [];

        // 3. Fetch Releases using Spotify URL if available
        if (artistData.spotifyUrl) {
            const rawUrl = artistData.spotifyUrl;
            const spotifyId = rawUrl.includes('spotify.com')
                ? rawUrl.split('/').pop().split('?')[0]
                : rawUrl;

            const releaseWhere = getReleaseArtistWhereById(spotifyId);
            if (releaseWhere) {
                releases = await prisma.release.findMany({
                    where: releaseWhere,
                    orderBy: { releaseDate: 'desc' }
                });
            }
        }

        // Additional check for Roster artists using their ID directly if URL didn't match
        if (isRoster && releases.length === 0) {
            const releaseWhere = getReleaseArtistWhereById(id);
            if (releaseWhere) {
                releases = await prisma.release.findMany({
                    where: releaseWhere,
                    orderBy: { releaseDate: 'desc' }
                });
            }
        }

        return new Response(JSON.stringify({
            demos: artistData.demos,
            releases: releases,
            profile: {
                id: artistData.id,
                name: artistData.stageName || artistData.name,
                email: artistData.email || 'Roster Artist',
                image: artistData.image,
                fullName: artistData.fullName,
                monthlyListeners: artistData.monthlyListeners,
                spotifyUrl: artistData.spotifyUrl
            }
        }), { status: 200 });

    } catch (e) {
        console.error("Fetch Details Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
