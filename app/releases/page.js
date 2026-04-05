import { redirect } from "next/navigation";

import { BRANDING } from "@/lib/branding";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublicReleaseCatalog } from "@/lib/release-catalog";
import { toReleaseSlug } from "@/lib/release-slug";

import ReleasesClient from "./ReleasesClient";

export const revalidate = 300;

const BASE_URL = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/\/+$/, "");
const PAGE_LIMIT = 24;

function normalizePageParam(value) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function getSeoLabelName(publicSettings) {
  if (publicSettings?.brandingFullName) return publicSettings.brandingFullName;
  if (publicSettings?.siteName) return publicSettings.siteName;
  return BRANDING.fullName;
}

function getCatalogDescription(labelName) {
  return `Explore the full catalog of ${labelName}. Browse releases, artists, and deep links to every public record in the label archive.`;
}

function getCatalogPath(page) {
  return page > 1 ? `/releases?page=${page}` : "/releases";
}

function getReleaseHref(release) {
  return `/releases/${toReleaseSlug(release.name, release.artist, release.id)}`;
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const currentPage = normalizePageParam(resolvedSearchParams?.page);
  const publicSettings = await getPublicSettings().catch(() => null);
  const labelName = getSeoLabelName(publicSettings);
  const title = currentPage > 1 ? `Releases Page ${currentPage}` : "Releases";
  const description = getCatalogDescription(labelName);
  const path = getCatalogPath(currentPage);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: labelName,
      url: `${BASE_URL}${path}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ReleasesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const currentPage = normalizePageParam(resolvedSearchParams?.page);

  const [publicSettings, catalog] = await Promise.all([
    getPublicSettings().catch(() => null),
    getPublicReleaseCatalog({ page: currentPage, limit: PAGE_LIMIT }),
  ]);

  if (catalog.pagination.total > 0 && currentPage > catalog.pagination.pages) {
    redirect(getCatalogPath(catalog.pagination.pages));
  }

  const labelName = getSeoLabelName(publicSettings);
  const description = getCatalogDescription(labelName);
  const pageUrl = `${BASE_URL}${getCatalogPath(currentPage)}`;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${labelName} Releases`,
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: labelName,
      url: BASE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalog.releases.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: catalog.releases.map((release, index) => ({
        "@type": "ListItem",
        position: (currentPage - 1) * PAGE_LIMIT + index + 1,
        name: `${release.name} - ${release.artist}`,
        url: `${BASE_URL}${getReleaseHref(release)}`,
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Releases", item: `${BASE_URL}/releases` },
      ...(currentPage > 1
        ? [{ "@type": "ListItem", position: 3, name: `Page ${currentPage}`, item: pageUrl }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd, breadcrumbLd]) }}
      />
      <ReleasesClient
        currentPage={currentPage}
        initialPagination={catalog.pagination}
        initialReleases={catalog.releases}
        labelName={labelName}
      />
    </>
  );
}
