import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function parseArtistsJson(artistsJson) {
    try {
        const parsed = JSON.parse(artistsJson || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeReleaseDate(value) {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
}

export async function GET(req, { params }) {
    const { id } = await params;
    try {
        const release = await prisma.release.findUnique({
            where: { id }
        });

        if (!release) {
            return new Response(JSON.stringify({ error: "Release not found" }), { status: 404 });
        }

        const parsedArtists = parseArtistsJson(release.artistsJson);
        const resolvedArtist = parsedArtists.length > 0
            ? parsedArtists.map((artist) => artist.name).join(", ")
            : release.artistName;

        const getBaseTitle = (title) => {
            if (!title) return "";
            return title.split(' (')[0].split(' - ')[0].trim();
        };
        const baseTitle = release.baseTitle || getBaseTitle(release.name);

        const versions = await prisma.release.findMany({
            where: {
                ...(baseTitle ? { baseTitle } : { id: release.id })
            },
            orderBy: [
                { popularity: "desc" },
                { releaseDate: "desc" }
            ]
        });

        const filteredVersions = versions.filter((version) => {
            if (baseTitle && version.baseTitle) return version.baseTitle === baseTitle;
            return getBaseTitle(version.name).toLowerCase() === baseTitle.toLowerCase();
        });

        return new Response(JSON.stringify({
            id: release.id,
            name: release.name,
            artist: resolvedArtist || "Unknown Artist",
            image: release.image,
            spotify_url: release.spotifyUrl,
            preview_url: release.previewUrl || null,
            release_date: release.releaseDate,
            popularity: release.popularity,
            stream_count_text: release.streamCountText,
            artists: parsedArtists,
            versions: filteredVersions.map(v => ({
                id: v.id,
                name: v.name,
                image: v.image,
                spotify_url: v.spotifyUrl,
                release_date: v.releaseDate,
                preview_url: v.previewUrl,
                artists: parseArtistsJson(v.artistsJson)
            }))
        }), { status: 200 });
    } catch (e) {
        console.error("Release Fetch Error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch release" }), { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    try {
        const release = await prisma.release.update({
            where: { id },
            data: {
                name: data.name,
                artistName: data.artistName,
                releaseDate: normalizeReleaseDate(data.releaseDate),
                image: data.image,
                spotifyUrl: data.spotifyUrl,
                type: data.type
            }
        });

        return new Response(JSON.stringify(release), { status: 200 });
    } catch (e) {
        console.error("Release Update Error:", e);
        return new Response(JSON.stringify({ error: "Failed to update release" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        // Optional: clean up contracts or requests if needed, but let's try direct delete first
        await prisma.release.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error("Release Delete Error:", e);
        return new Response(JSON.stringify({ error: "Failed to delete release. It may be linked to contracts or requests." }), { status: 500 });
    }
}
