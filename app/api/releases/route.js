import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const nowIso = new Date().toISOString();
        const releases = await prisma.release.findMany({
            where: {
                releaseDate: {
                    lte: nowIso
                }
            },
            orderBy: [
                { popularity: 'desc' },
                { releaseDate: 'desc' }
            ]
        });

        return new Response(JSON.stringify({
            success: true,
            releases: (() => {
                const uniqueAlbums = new Map();
                releases.forEach(r => {
                    // Group by baseTitle if available, otherwise by name + artistName
                    const groupKey = r.baseTitle || `${r.name}_${r.artistName}`;

                    if (!uniqueAlbums.has(groupKey)) {
                        uniqueAlbums.set(groupKey, r);
                    } else {
                        // If we already have this album, keep the one with higher popularity
                        const existing = uniqueAlbums.get(groupKey);
                        if ((r.popularity || 0) > (existing.popularity || 0)) {
                            uniqueAlbums.set(groupKey, r);
                        }
                    }
                });

                return Array.from(uniqueAlbums.values()).map(r => {
                    // Public releases should only expose public preview URLs
                    let previewUrl = r.previewUrl || null;

                    let resolvedArtist = r.artistName;
                    try {
                        const parsedArtists = JSON.parse(r.artistsJson || '[]');
                        if (parsedArtists.length > 0) {
                            resolvedArtist = parsedArtists.map(a => a.name).join(", ");
                        }
                    } catch (e) { }

                    return {
                        id: r.id,
                        name: r.name,
                        baseTitle: r.baseTitle,
                        versionName: r.versionName,
                        artist: resolvedArtist || "Unknown Artist",
                        image: r.image,
                        spotify_url: r.spotifyUrl,
                        preview_url: previewUrl,
                        release_date: r.releaseDate,
                        popularity: r.popularity,
                        stream_count_text: r.streamCountText,
                        artists: JSON.parse(r.artistsJson || '[]')
                    };
                });
            })()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error("[Releases API] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
