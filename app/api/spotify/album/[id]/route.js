import { getAlbum } from "@/lib/spotify";

export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const data = await getAlbum(id);

        if (!data) {
            return new Response(JSON.stringify({
                error: "FAILED_TO_FETCH_SPOTIFY_DATA",
                message: "Please check terminal logs for details"
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            name: data.name,
            artist: data.artists[0]?.name,
            image: data.images[0]?.url,
            release_date: data.release_date,
            total_tracks: data.total_tracks,
            spotify_url: data.external_urls.spotify
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Critical API Route Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
