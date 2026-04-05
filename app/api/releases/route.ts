import { parseOffsetPagination } from "@/lib/api-pagination";
import { getPublicReleaseCatalog } from "@/lib/release-catalog";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit } = parseOffsetPagination(searchParams, { defaultLimit: 24, maxLimit: 60 });
    const artistId = searchParams.get("artist");
    const { releases, pagination } = await getPublicReleaseCatalog({
      artistId,
      limit,
      page,
    });

    return Response.json(
      {
        success: true,
        releases,
        pagination,
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
