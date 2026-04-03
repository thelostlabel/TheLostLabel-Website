import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { TENANT } from "@/lib/tenant";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import { StatsProcessSection } from "@/components/ui/stats-process-section";
import { CTASection } from "@/components/ui/cta-section";
import { LostReleasesSection } from "@/components/ui/lost-releases-section";
import { SiteNavbar } from "@/components/ui/site-navbar";
import { PageReveal } from "@/components/ui/page-reveal";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ScrollAtmosphere } from "@/components/ui/scroll-atmosphere";
import { ArtistShowcaseSection } from "@/components/ui/artist-showcase-section";
import { SiteFooter } from "@/components/ui/site-footer";
import prisma from "@/lib/prisma";
import { getPublicSettings } from "@/lib/public-settings";

const HERO_RELEASE_SELECT = Prisma.sql`
  "id",
  "name",
  "artistName",
  "image",
  "streamCountText",
  "spotifyUrl",
  "releaseDate"
`;

export default async function HomePage() {
    if (!TENANT.features.homePage) {
        redirect('/dashboard');
    }

    const publicSettings = await getPublicSettings().catch(() => null);
    const nowIso = new Date().toISOString();
    const dedupeKeySql = Prisma.sql`COALESCE("baseTitle", "name" || '_' || COALESCE("artistName", ''))`;
    const featuredReleaseId = publicSettings?.featuredReleaseId ?? null;

    const pinnedRelease = featuredReleaseId
        ? await prisma.$queryRaw`
            SELECT ${HERO_RELEASE_SELECT}
            FROM "Release"
            WHERE "id" = ${featuredReleaseId}
              AND "spotifyUrl" IS NOT NULL
              AND "releaseDate" <= ${nowIso}
            LIMIT 1
        `.catch(() => [])
        : [];

    const pinnedIds = pinnedRelease.map((release) => release.id);
    const exclusions = pinnedIds.length > 0
        ? Prisma.sql`AND deduped."id" NOT IN (${Prisma.join(pinnedIds)})`
        : Prisma.empty;

    const remainingReleases = await prisma.$queryRaw`
        SELECT
          deduped."id",
          deduped."name",
          deduped."artistName",
          deduped."image",
          deduped."streamCountText",
          deduped."spotifyUrl",
          deduped."releaseDate"
        FROM (
          SELECT DISTINCT ON (${dedupeKeySql})
            "id",
            "name",
            "artistName",
            "image",
            "streamCountText",
            "spotifyUrl",
            "releaseDate",
            "popularity"
          FROM "Release"
          WHERE "releaseDate" <= ${nowIso}
            AND "spotifyUrl" IS NOT NULL
            AND "popularity" IS NOT NULL
          ORDER BY ${dedupeKeySql}, "popularity" DESC NULLS LAST, "releaseDate" DESC NULLS LAST, "id" ASC
        ) AS deduped
        WHERE 1 = 1
        ${exclusions}
        ORDER BY deduped."popularity" DESC NULLS LAST, deduped."releaseDate" DESC NULLS LAST, deduped."id" ASC
        LIMIT ${Math.max(0, 3 - pinnedIds.length)}
    `.catch(() => []);

    const featuredReleases = [...pinnedRelease, ...remainingReleases];

    const [artistCount, releaseCount, demoCount, showcaseArtists] = await Promise.all([
        prisma.user.count({ where: { role: 'artist', status: 'active' } }).catch(() => 50),
        prisma.release.count().catch(() => 80),
        prisma.demo.count().catch(() => 300),
        prisma.artist.findMany({
            where: { status: 'active' },
            orderBy: [{ popularity: 'desc' }, { monthlyListeners: 'desc' }],
            take: 30,
            select: { id: true, name: true, image: true, genres: true, monthlyListeners: true },
        }).catch(() => []),
    ]);

    return (
        <div className="overflow-x-hidden w-full min-h-screen bg-black">
            <PageReveal />
            <ScrollProgress />
            <ScrollAtmosphere />
            <SiteNavbar />
            <CinematicHero
                brandName="LOST."
                tagline1="Submit your demo,"
                tagline2="start your journey."
            />
            <LostReleasesSection
                releases={featuredReleases}
                highlights={{
                    [publicSettings?.featuredReleaseId || "rel_57df6296-fd95-4185-bad4-3f74c1386bf0"]: "#74 on Spotify Official Phonk Playlist",
                    "2UPwhike9Qp0u3p0OaUzcP": "75M+ total streams across platforms",
                }}
            />
            <StatsProcessSection artistCount={artistCount} releaseCount={releaseCount} demoCount={demoCount} />
            <ArtistShowcaseSection artists={showcaseArtists} />
            <CTASection
                heading="Join the label."
                description="Submit your demo and become part of a growing community of independent artists."
                primaryLabel="Apply Now"
                primaryHref="/auth/register"
                secondaryLabel="Sign In"
                secondaryHref="/auth/login"
            />
            <SiteFooter />
        </div>
    );
}
