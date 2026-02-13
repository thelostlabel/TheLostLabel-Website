import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const releases = await prisma.release.findMany({
            where: {
                releaseDate: {
                    lte: new Date().toISOString()
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
                    // Try to extract Album ID from Spotify URL
                    // URL format: https://open.spotify.com/track/TRACK_ID or album/ALBUM_ID
                    // Wait, our spotifyUrl is usually the Track URL now. 
                    // But we stored Album Image which is consistent for the album.
                    // Let's deduce Album ID from the Track URL? No, track URL is unique.
                    // Actually, we don't have a dedicated Album ID column. 
                    // BUT, tracks from the same album share the exact same Image URL (usually).
                    // Or we can group by (ArtistName + AlbumName).

                    // BEST APPROACH: Group by IMAGE URL (since it's per-album).
                    // This is a heuristic but works 99% for Spotify albums.

                    if (!uniqueAlbums.has(r.image)) {
                        uniqueAlbums.set(r.image, r);
                    } else {
                        // If we already have this album, keep the one with higher popularity
                        const existing = uniqueAlbums.get(r.image);
                        if ((r.popularity || 0) > (existing.popularity || 0)) {
                            uniqueAlbums.set(r.image, r);
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
