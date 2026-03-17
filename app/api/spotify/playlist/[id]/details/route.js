import { getPlaylistDetails } from "@/lib/spotify";

export async function GET(req, { params }) {
    const { id } = await params;

    try {
        const details = await getPlaylistDetails(id);

        if (!details) {
            return new Response(JSON.stringify({ error: "Playlist details not found" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(details), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
