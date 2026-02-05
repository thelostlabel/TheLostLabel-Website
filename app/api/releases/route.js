import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const releases = await prisma.release.findMany({
            orderBy: {
                releaseDate: 'desc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            releases: releases.map(r => ({
                id: r.id,
                name: r.name,
                artist: r.artistName,
                image: r.image,
                spotify_url: r.spotifyUrl,
                release_date: r.releaseDate,
                artists: JSON.parse(r.artistsJson || '[]')
            }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("[Releases API] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
