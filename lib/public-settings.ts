import { unstable_cache } from "next/cache";

import prisma from "@/lib/prisma";
import {
  DEFAULT_PUBLIC_SETTINGS,
  pickPublicSettings,
  type PublicSettings,
} from "@/lib/system-settings";

export const PUBLIC_SETTINGS_REVALIDATE_SECONDS = 300;
export const PUBLIC_SETTINGS_CACHE_TAG = "public-settings";

const getCachedPublicSettings = unstable_cache(
  async () => {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { config: true },
    });

    return pickPublicSettings(settings?.config);
  },
  ["public-settings"],
  {
    revalidate: PUBLIC_SETTINGS_REVALIDATE_SECONDS,
    tags: [PUBLIC_SETTINGS_CACHE_TAG],
  },
);

function isDatabaseUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Environment variable not found: DATABASE_URL');
}

export async function getPublicSettings() {
  if (!process.env.DATABASE_URL) {
    return getDefaultPublicSettings();
  }

  try {
    return await getCachedPublicSettings();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return getDefaultPublicSettings();
    }

    throw error;
  }
}

export function getDefaultPublicSettings() {
  return {
    ...DEFAULT_PUBLIC_SETTINGS,
    genres: [...DEFAULT_PUBLIC_SETTINGS.genres],
  };
}

export type { PublicSettings };
export { DEFAULT_PUBLIC_SETTINGS };
