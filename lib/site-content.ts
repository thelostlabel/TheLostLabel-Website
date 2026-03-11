import { unstable_cache } from "next/cache";

import prisma from "@/lib/prisma";
import {
  MANAGED_SITE_CONTENT_KEYS,
  type SiteContentKey,
  type SiteContentRecord,
  getDefaultSiteContentEntry,
} from "@/lib/site-content-data";

export const SITE_CONTENT_CACHE_TAG = "site-content";
export const SITE_CONTENT_REVALIDATE_SECONDS = 300;

const getCachedManagedSiteContent = unstable_cache(
  async () => {
    return prisma.siteContent.findMany({
      where: {
        key: {
          in: MANAGED_SITE_CONTENT_KEYS,
        },
      },
      orderBy: { key: "asc" },
    });
  },
  ["site-content"],
  {
    revalidate: SITE_CONTENT_REVALIDATE_SECONDS,
    tags: [SITE_CONTENT_CACHE_TAG],
  },
);

function isDatabaseUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Environment variable not found: DATABASE_URL");
}

export async function getManagedSiteContent(): Promise<SiteContentRecord[]> {
  if (!process.env.DATABASE_URL) {
    return MANAGED_SITE_CONTENT_KEYS.map((key) => getDefaultSiteContentEntry(key));
  }

  try {
    const rows = await getCachedManagedSiteContent();
    const byKey = new Map(rows.map((row) => [row.key, row]));

    return MANAGED_SITE_CONTENT_KEYS.map((key) => {
      const row = byKey.get(key);
      if (!row) {
        return getDefaultSiteContentEntry(key);
      }

      return {
        key,
        title: row.title,
        content: row.content,
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return MANAGED_SITE_CONTENT_KEYS.map((key) => getDefaultSiteContentEntry(key));
    }

    throw error;
  }
}

export async function getSiteContentByKey(key: SiteContentKey) {
  const content = await getManagedSiteContent();
  return content.find((item) => item.key === key) || getDefaultSiteContentEntry(key);
}
