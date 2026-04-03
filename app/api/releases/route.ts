import type { Release } from "@prisma/client";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { mapPublicRelease } from "@/lib/public-api";

type ReleaseListRow = Pick<
  Release,
  | "id"
  | "name"
  | "baseTitle"
  | "versionName"
  | "artistName"
  | "image"
  | "spotifyUrl"
  | "previewUrl"
  | "releaseDate"
  | "popularity"
  | "streamCountText"
  | "artistsJson"
>;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 24, maxLimit: 60 });
    const artistId = searchParams.get("artist");
    const nowIso = new Date().toISOString();
    const dedupeKeySql = Prisma.sql`COALESCE("baseTitle", "name" || '_' || COALESCE("artistName", ''))`;

    const [releases, totalRows] = artistId
      ? await Promise.all([
          prisma.$queryRaw<ReleaseListRow[]>`
            SELECT
              r."id", r."name", r."baseTitle", r."versionName", r."artistName",
              r."image", r."spotifyUrl", r."previewUrl", r."releaseDate",
              r."popularity", r."streamCountText", r."artistsJson"
            FROM "Release" r
            INNER JOIN "ReleaseArtist" ra ON ra."releaseId" = r."id"
            WHERE ra."artistId" = ${artistId}
              AND r."releaseDate" <= ${nowIso}
            ORDER BY r."popularity" DESC NULLS LAST, r."releaseDate" DESC NULLS LAST, r."id" ASC
            LIMIT ${limit}
            OFFSET ${skip}
          `,
          prisma.$queryRaw<{ total: bigint }[]>`
            SELECT COUNT(*)::bigint AS total
            FROM "Release" r
            INNER JOIN "ReleaseArtist" ra ON ra."releaseId" = r."id"
            WHERE ra."artistId" = ${artistId}
              AND r."releaseDate" <= ${nowIso}
          `,
        ])
      : await Promise.all([
          prisma.$queryRaw<ReleaseListRow[]>`
            SELECT
              deduped."id",
              deduped."name",
              deduped."baseTitle",
              deduped."versionName",
              deduped."artistName",
              deduped."image",
              deduped."spotifyUrl",
              deduped."previewUrl",
              deduped."releaseDate",
              deduped."popularity",
              deduped."streamCountText",
              deduped."artistsJson"
            FROM (
              SELECT DISTINCT ON (${dedupeKeySql})
                "id", "name", "baseTitle", "versionName", "artistName",
                "image", "spotifyUrl", "previewUrl", "releaseDate",
                "popularity", "streamCountText", "artistsJson",
                ${dedupeKeySql} AS "groupKey"
              FROM "Release"
              WHERE "releaseDate" <= ${nowIso}
              ORDER BY ${dedupeKeySql}, "popularity" DESC NULLS LAST, "releaseDate" DESC NULLS LAST, "id" ASC
            ) AS deduped
            ORDER BY deduped."popularity" DESC NULLS LAST, deduped."releaseDate" DESC NULLS LAST, deduped."id" ASC
            LIMIT ${limit}
            OFFSET ${skip}
          `,
          prisma.$queryRaw<{ total: bigint }[]>`
            SELECT COUNT(*)::bigint AS total
            FROM (
              SELECT DISTINCT ON (${dedupeKeySql}) "id"
              FROM "Release"
              WHERE "releaseDate" <= ${nowIso}
              ORDER BY ${dedupeKeySql}, "popularity" DESC NULLS LAST, "releaseDate" DESC NULLS LAST, "id" ASC
            ) AS deduped_count
          `,
        ]);

    const total = Number(totalRows?.[0]?.total || 0);

    return Response.json(
      {
        success: true,
        releases: releases.map(mapPublicRelease),
        pagination: buildOffsetPaginationMeta(total, page, limit),
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
