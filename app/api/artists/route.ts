import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { mapPublicArtist } from "@/lib/public-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 24, maxLimit: 60 });
    const where = {
      status: "active",
      spotifyUrl: { not: null },
    } as const;

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy: {
          monthlyListeners: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          spotifyUrl: true,
          followers: true,
          monthlyListeners: true,
          genres: true,
          verified: true,
          lastSyncedAt: true,
        },
      }),
      prisma.artist.count({ where }),
    ]);

    return Response.json(
      {
        success: true,
        artists: artists.map(mapPublicArtist),
        pagination: buildOffsetPaginationMeta(total, page, limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    (logger as { error: (message: string, error?: unknown) => void }).error(
      "Failed to fetch artists",
      error instanceof Error ? error : new Error(String(error)),
    );
    return Response.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
