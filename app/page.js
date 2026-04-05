export const revalidate = 300;

import Link from "next/link";
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
import { BRANDING } from "@/lib/branding";
import prisma from "@/lib/prisma";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublicReleaseCatalog } from "@/lib/release-catalog";
import { toReleaseSlug } from "@/lib/release-slug";

const HERO_RELEASE_SELECT = Prisma.sql`
  "id",
  "name",
  "artistName",
  "image",
  "streamCountText",
  "spotifyUrl",
  "releaseDate"
`;

function getSeoLabelName(publicSettings) {
    if (publicSettings?.brandingFullName) return publicSettings.brandingFullName;
    if (publicSettings?.siteName) return publicSettings.siteName;
    return BRANDING.fullName;
}

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

    const [artistCount, releaseCount, demoCount, showcaseArtists, catalogDiscovery] = await Promise.all([
        prisma.artist.count({ where: { status: 'active' } }).catch(() => 50),
        prisma.release.count().catch(() => 80),
        prisma.demo.count().catch(() => 300),
        prisma.artist.findMany({
            where: { status: 'active' },
            orderBy: [{ popularity: 'desc' }, { monthlyListeners: 'desc' }],
            take: 30,
            select: { id: true, name: true, image: true, genres: true, monthlyListeners: true },
        }).catch(() => []),
        getPublicReleaseCatalog({ page: 1, limit: 12 }).then((result) => result.releases).catch(() => []),
    ]);
    const labelName = getSeoLabelName(publicSettings);

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
            {catalogDiscovery.length > 0 && (
                <section
                    style={{
                        position: "relative",
                        zIndex: 1,
                        padding: "48px clamp(24px, 5vw, 80px) 0",
                        background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.92) 24%, #050505 100%)",
                    }}
                >
                    <div
                        style={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.025)",
                            borderRadius: "28px",
                            padding: "28px clamp(20px, 4vw, 40px)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "16px",
                                alignItems: "baseline",
                                justifyContent: "space-between",
                                marginBottom: "24px",
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        letterSpacing: "0.32em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.3)",
                                    }}
                                >
                                    Catalog Index
                                </p>
                                <h2
                                    style={{
                                        margin: "10px 0 0",
                                        fontSize: "clamp(28px, 4vw, 44px)",
                                        fontWeight: "900",
                                        letterSpacing: "-0.04em",
                                        color: "#fff",
                                    }}
                                >
                                    Explore more from the archive.
                                </h2>
                                <p
                                    style={{
                                        margin: "10px 0 0",
                                        maxWidth: "640px",
                                        color: "rgba(255,255,255,0.55)",
                                        lineHeight: 1.7,
                                        fontSize: "14px",
                                    }}
                                >
                                    Jump into public release pages from {labelName} or open the full catalog hub.
                                </p>
                            </div>

                            <Link
                                href="/releases"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: "44px",
                                    padding: "0 18px",
                                    borderRadius: "999px",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    textDecoration: "none",
                                    color: "#fff",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                }}
                            >
                                View All Releases
                            </Link>
                        </div>

                        <nav
                            aria-label="Homepage release discovery"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "12px",
                            }}
                        >
                            {catalogDiscovery.map((release) => (
                                <Link
                                    key={release.id}
                                    href={`/releases/${toReleaseSlug(release.name, release.artist, release.id)}`}
                                    style={{
                                        display: "block",
                                        textDecoration: "none",
                                        color: "#fff",
                                        padding: "14px 16px",
                                        borderRadius: "18px",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "10px",
                                            fontWeight: "800",
                                            letterSpacing: "0.24em",
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.28)",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        Release Page
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "15px",
                                            fontWeight: "700",
                                            letterSpacing: "-0.02em",
                                            color: "#fff",
                                        }}
                                    >
                                        {release.name}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: "6px",
                                            color: "rgba(255,255,255,0.52)",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {release.artist}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </section>
            )}
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
