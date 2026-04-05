import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { toReleaseSlug } from "@/lib/release-slug";
import { getBaseUrl } from "@/lib/site-url";

export const revalidate = 300;

const BASE_URL = getBaseUrl();
const RELEASES_PAGE_SIZE = 24;
const dedupeKeySql = Prisma.sql`COALESCE("baseTitle", "name" || '_' || COALESCE("artistName", ''))`;

function getStaticRoutes(now) {
    return [
        { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE_URL}/artists`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/releases`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/join`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ];
}

function logSitemapError(scope, error) {
    console.error(`[sitemap] ${scope} failed:`, error);
}

export default async function sitemap() {
    const now = new Date();
    const staticRoutes = getStaticRoutes(now);

    if (!process.env.DATABASE_URL) {
        return staticRoutes;
    }

    const nowIso = now.toISOString();

    const [artistsResult, releasesResult, paginatedCountResult] = await Promise.allSettled([
        prisma.artist.findMany({
            where: { status: "active" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.release.findMany({
            where: {
                releaseDate: {
                    lte: nowIso,
                },
            },
            select: { id: true, name: true, artistName: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.$queryRaw`
            SELECT COUNT(*)::bigint AS total
            FROM (
                SELECT DISTINCT ON (${dedupeKeySql}) "id"
                FROM "Release"
                WHERE "releaseDate" <= ${nowIso}
                ORDER BY ${dedupeKeySql}, "popularity" DESC NULLS LAST, "releaseDate" DESC NULLS LAST, "id" ASC
            ) AS deduped_count
        `,
    ]);

    if (artistsResult.status === "rejected") {
        logSitemapError("artist routes", artistsResult.reason);
    }

    if (releasesResult.status === "rejected") {
        logSitemapError("release routes", releasesResult.reason);
    }

    if (paginatedCountResult.status === "rejected") {
        logSitemapError("release pagination routes", paginatedCountResult.reason);
    }

    const artistRoutes =
        artistsResult.status === "fulfilled"
            ? artistsResult.value.map((artist) => ({
                url: `${BASE_URL}/artists/${artist.id}`,
                lastModified: artist.updatedAt || now,
                changeFrequency: "weekly",
                priority: 0.75,
            }))
            : [];

    const releaseRoutes =
        releasesResult.status === "fulfilled"
            ? releasesResult.value.map((release) => ({
                url: `${BASE_URL}/releases/${toReleaseSlug(release.name, release.artistName, release.id)}`,
                lastModified: release.updatedAt || now,
                changeFrequency: "weekly",
                priority: 0.75,
            }))
            : [];

    const paginatedCatalogRoutes = (() => {
        if (paginatedCountResult.status !== "fulfilled") {
            return [];
        }

        const total = Number(paginatedCountResult.value?.[0]?.total || 0);
        const totalPages = Math.max(1, Math.ceil(total / RELEASES_PAGE_SIZE));

        return Array.from({ length: totalPages - 1 }, (_, index) => {
            const page = index + 2;
            return {
                url: `${BASE_URL}/releases?page=${page}`,
                lastModified: now,
                changeFrequency: "daily",
                priority: 0.8,
            };
        });
    })();

    return [...staticRoutes, ...paginatedCatalogRoutes, ...artistRoutes, ...releaseRoutes];
}
