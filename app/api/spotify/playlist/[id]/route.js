import { getPlaylistTracks, getArtistsDetails } from "@/lib/spotify";

export async function GET(req, { params }) {
    const { id } = await params;
    console.log(`[Spotify Sync] Starting sync for playlist: ${id}`);

    try {
        console.log(`[Spotify Sync] Fetching tracks...`);
        const items = await getPlaylistTracks(id);

        if (!items) {
            console.error(`[Spotify Sync] Failed to fetch items for playlist: ${id}`);
            return new Response(JSON.stringify({ error: "Playlist data not accessible" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`[Spotify Sync] Found ${items.length} items. Processing releases...`);
        const releasesMap = new Map();
        const artistIdsSet = new Set();

        items.forEach(item => {
            if (!item.track) return;

            // Collect Albums
            const album = item.track.album;
            if (!releasesMap.has(album.id)) {
                releasesMap.set(album.id, {
                    id: album.id,
                    name: album.name,
                    artist: album.artists?.[0]?.name || "Unknown",
                    artists: album.artists.map(a => ({ id: a.id, name: a.name })),
                    image: album.images[0]?.url,
                    spotify_url: album.external_urls.spotify,
                    release_date: album.release_date
                });
            }

            // Collect unique Artist IDs
            item.track.artists.forEach(a => artistIdsSet.add(a.id));
        });

        const releases = Array.from(releasesMap.values()).sort((a, b) =>
            new Date(b.release_date) - new Date(a.release_date)
        );

        console.log(`[Spotify Sync] Processed ${releases.length} unique releases. Fetching details for ${artistIdsSet.size} artists...`);

        // Fetch detailed artist info (images, followers, etc.)
        const artistIds = Array.from(artistIdsSet);
        const detailedArtists = await getArtistsDetails(artistIds);

        const sortedArtists = (detailedArtists || [])
            .filter(a => a)
            .sort((a, b) => (b.followers?.total || 0) - (a.followers?.total || 0)) || [];

        console.log(`[Spotify Sync] Sync complete. Returning ${releases.length} releases and ${sortedArtists.length} artists.`);

        return new Response(JSON.stringify({
            releases,
            artists: sortedArtists.map(a => ({
                id: a.id,
                name: a.name,
                image: a.images?.[0]?.url || a.images?.[1]?.url,
                followers: a.followers?.total || 0,
                genres: a.genres || [],
                spotify_url: a.external_urls?.spotify
            }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("[Spotify Sync] Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
