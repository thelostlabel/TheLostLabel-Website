import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function hasExactArtistId(artistsJson, artistId) {
    if (!artistId || !artistsJson) return false;
    try {
        const parsed = JSON.parse(artistsJson);
        if (!Array.isArray(parsed)) return false;
        return parsed.some((artist) => artist?.id === artistId);
    } catch {
        return false;
    }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const artistId = searchParams.get('artistId');

        const releases = await prisma.release.findMany({
            where: artistId ? {
                artistsJson: { contains: artistId }
            } : {},
            orderBy: { createdAt: 'desc' }
        });
        const filtered = artistId
            ? releases.filter((release) => hasExactArtistId(release.artistsJson, artistId))
            : releases;
        return new Response(JSON.stringify(filtered), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
