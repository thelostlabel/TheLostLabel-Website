import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById } from "@/lib/release-artists";

export async function GET(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const artistId = searchParams.get('artistId');
        const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });
        const artistRecord = artistId
            ? await prisma.artist.findUnique({
                where: { id: artistId },
                select: { spotifyUrl: true }
            })
            : null;
        const spotifyArtistId = artistRecord?.spotifyUrl?.split('/').filter(Boolean).pop()?.split('?')[0] || null;
        const artistFilters = [getReleaseArtistWhereById(artistId), getReleaseArtistWhereById(spotifyArtistId)].filter(Boolean);
        const where = artistFilters.length > 0 ? { OR: artistFilters } : {};

        const [releases, total] = await Promise.all([
            prisma.release.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.release.count({ where })
        ]);
        return new Response(JSON.stringify({
            releases,
            pagination: buildOffsetPaginationMeta(total, page, limit)
        }), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
