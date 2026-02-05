import { getAccessToken } from "@/lib/spotify";

export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const tokenData = await getAccessToken();
        if (!tokenData?.access_token) {
            return new Response(JSON.stringify({ error: "Spotify auth failed" }), { status: 500 });
        }

        // Fetch artist info
        const artistRes = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        if (!artistRes.ok) {
            return new Response(JSON.stringify({ error: "Artist not found" }), { status: 404 });
        }

        const artist = await artistRes.json();

        // MERGE: Get local data from DB (monthly listeners)
        let dbArtist = null;
        try {
            const { default: prisma } = await import("@/lib/prisma");
            dbArtist = await prisma.artist.findUnique({ where: { id } });
        } catch (e) {
            console.error("[Artist API] DB Error:", e.message);
        }

        if (dbArtist) {
            artist.monthlyListeners = dbArtist.monthlyListeners;
            artist.localFollowers = dbArtist.followers;
            artist.lastSyncedAt = dbArtist.lastSyncedAt;
        }

        // Fetch artist's albums
        const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=50`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const albumsData = await albumsRes.json();
        const releases = albumsData.items || [];

        return new Response(JSON.stringify({ artist, releases }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("[Artist API] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
