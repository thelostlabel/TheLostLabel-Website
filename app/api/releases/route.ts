import prisma from "@/lib/prisma";
import { mapPublicRelease } from "@/lib/public-api";

export async function GET() {
  try {
    const nowIso = new Date().toISOString();
    const releases = await prisma.release.findMany({
      where: {
        releaseDate: {
          lte: nowIso,
        },
      },
      orderBy: [{ popularity: "desc" }, { releaseDate: "desc" }],
    });

    const uniqueAlbums = new Map<string, (typeof releases)[number]>();

    for (const release of releases) {
      const groupKey = release.baseTitle || `${release.name}_${release.artistName}`;
      const existing = uniqueAlbums.get(groupKey);

      if (!existing || (release.popularity ?? 0) > (existing.popularity ?? 0)) {
        uniqueAlbums.set(groupKey, release);
      }
    }

    return Response.json(
      {
        success: true,
        releases: Array.from(uniqueAlbums.values()).map(mapPublicRelease),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Releases API] Error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
