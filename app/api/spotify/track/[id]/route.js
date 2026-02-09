import { getTrack } from "@/lib/spotify";

export async function GET(req, { params }) {
  const { id } = await params;
  try {
    const data = await getTrack(id);
    if (!data) {
      console.error(`Failed to fetch track: ${id}`);
      return new Response(JSON.stringify({ error: "FAILED_TO_FETCH_TRACK", id }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const artists = (data.artists || []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      spotify_url: artist.external_urls?.spotify
    }));
    return new Response(JSON.stringify({
      name: data.name,
      artist: data.artists?.[0]?.name,
      artists,
      image: data.album?.images?.[0]?.url,
      preview_url: data.preview_url,
      spotify_url: data.external_urls?.spotify,
      duration_ms: data.duration_ms,
      release_date: data.album?.release_date || null,
      album_id: data.album?.id || null
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(`Error in /api/spotify/track/${id}:`, e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
