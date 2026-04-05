import type { Release } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  buildOffsetPaginationMeta,
  type OffsetPaginationMeta,
} from "@/lib/api-pagination";
import prisma from "@/lib/prisma";
import { mapPublicRelease, type PublicRelease } from "@/lib/public-api";

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

export type PublicReleaseCatalogResult = {
  releases: PublicRelease[];
  pagination: OffsetPaginationMeta;
};

const dedupeKeySql = Prisma.sql`COALESCE("baseTitle", "name" || '_' || COALESCE("artistName", ''))`;

export async function getPublicReleaseCatalog({
  artistId,
  limit = 24,
  page = 1,
}: {
  artistId?: string | null;
  limit?: number;
  page?: number;
} = {}): Promise<PublicReleaseCatalogResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 60) : 24;
  const skip = (safePage - 1) * safeLimit;
  const nowIso = new Date().toISOString();

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
          LIMIT ${safeLimit}
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
          LIMIT ${safeLimit}
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

  return {
    releases: releases.map(mapPublicRelease),
    pagination: buildOffsetPaginationMeta(total, safePage, safeLimit),
  };
}
