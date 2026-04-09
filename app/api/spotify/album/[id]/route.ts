import { NextRequest } from "next/server";
import { getAlbum } from "@/lib/spotify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const previewTrack = data.tracks?.items?.find((t: { preview_url?: string }) => t?.preview_url);

        console.log(`[Album API] ID: ${id} | Preview Found: ${!!previewTrack} | URL: ${previewTrack?.preview_url}`);

        return new Response(JSON.stringify({
            name: data.name,
            artist: data.artists?.map((a: { name: string }) => a.name).join(", "),
            artists: data.artists?.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
            image: data.images[0]?.url,
            release_date: data.release_date,
            total_tracks: data.total_tracks,
            spotify_url: data.external_urls.spotify,
            preview_url: previewTrack?.preview_url || null,
            preview_track_name: previewTrack?.name || null,
            tracks: data.tracks?.items?.map((t: { id: string; name: string; duration_ms: number; preview_url?: string; artists?: { id: string; name: string }[]; external_urls?: { spotify?: string } }) => ({
                id: t.id,
                name: t.name,
                duration_ms: t.duration_ms,
                preview_url: t.preview_url,
                artists: t.artists?.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
                spotify_link: t.external_urls?.spotify
            }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: unknown) {
        console.error("Critical API Route Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
