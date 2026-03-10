import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { mapPublicArtist } from "@/lib/public-api";

export async function GET() {
  try {
    const artists = await prisma.artist.findMany({
      where: {
        status: "active",
        spotifyUrl: { not: null },
      },
      orderBy: {
        monthlyListeners: "desc",
      },
    });

    return Response.json(
      {
        success: true,
        artists: artists.map(mapPublicArtist),
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
