import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

type StatsResponse = {
  artistCount: number;
  albumCount: number;
  songCount: number;
};

export async function GET() {
  try {
    const [artistCount, albumCount, songCountData] = await Promise.all([
      prisma.artist.count(),
      prisma.release.count({ where: { type: "album" } }),
      prisma.release.aggregate({
        _sum: {
          totalTracks: true,
        },
      }),
    ]);

    const payload: StatsResponse = {
      artistCount,
      albumCount,
      songCount: songCountData._sum.totalTracks ?? 0,
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    (logger as { error: (message: string, error?: unknown) => void }).error(
      "Failed to fetch stats",
      error instanceof Error ? error : new Error(String(error)),
    );
    return Response.json({ artistCount: 0, albumCount: 0, songCount: 0 } satisfies StatsResponse);
  }
}
