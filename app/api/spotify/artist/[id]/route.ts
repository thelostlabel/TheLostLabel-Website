import { NextRequest } from "next/server";
import { getAccessToken } from "@/lib/spotify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        let dbArtist: { monthlyListeners?: number; followers?: number; lastSyncedAt?: Date } | null = null;
        try {
            const { default: prisma } = await import("@/lib/prisma");
            dbArtist = await prisma.artist.findUnique({ where: { id } });
        } catch (error: unknown) {
            console.error("[Artist API] DB Error:", error instanceof Error ? error.message : "Unknown error");
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
    } catch (error: unknown) {
        console.error("[Artist API] Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
