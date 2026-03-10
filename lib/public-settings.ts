import { unstable_cache } from "next/cache";

import prisma from "@/lib/prisma";

export type PublicSettings = {
  genres: string[];
  siteName: string;
  heroText: string;
  heroSubText: string;
  featuredReleaseId: string | null;
  featuredReleaseLabel: string;
  featuredReleaseSubLabel: string;
  featuredReleaseStatus: string;
  discord: string;
  instagram: string;
  spotify: string;
  youtube: string;
  twitter: string;
  facebook: string;
  showStats: boolean;
  registrationsOpen: boolean;
  maintenanceMode: boolean;
  joinHeroTitle: string;
  joinHeroSub: string;
};

export const PUBLIC_SETTINGS_REVALIDATE_SECONDS = 300;
export const PUBLIC_SETTINGS_CACHE_TAG = "public-settings";

const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  genres: ["Hip-Hop", "R&B", "Pop", "Electronic", "Phonk", "Brazilian Funk", "Other"],
  siteName: "LOST MUSIC",
  heroText: "THE NEW ORDER",
  heroSubText: "INDEPENDENT DISTRIBUTION REDEFINED.",
  featuredReleaseId: null,
  featuredReleaseLabel: "FEATURED RELEASE",
  featuredReleaseSubLabel: "NOW STREAMING",
  featuredReleaseStatus: "Featured",
  discord: "",
  instagram: "",
  spotify: "",
  youtube: "",
  twitter: "",
  facebook: "",
  showStats: true,
  registrationsOpen: true,
  maintenanceMode: false,
  joinHeroTitle: "WORK WITH THE LOST. COMPANY",
  joinHeroSub: "A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS",
};

function parsePublicSettingsConfig(config: string | null | undefined): PublicSettings {
  if (!config) {
    return { ...DEFAULT_PUBLIC_SETTINGS };
  }

  try {
    const parsed = JSON.parse(config) as Record<string, unknown>;
    return {
      genres: Array.isArray(parsed.genres) ? (parsed.genres as string[]) : DEFAULT_PUBLIC_SETTINGS.genres,
      siteName: typeof parsed.siteName === "string" ? parsed.siteName : DEFAULT_PUBLIC_SETTINGS.siteName,
      heroText: typeof parsed.heroText === "string" ? parsed.heroText : DEFAULT_PUBLIC_SETTINGS.heroText,
      heroSubText: typeof parsed.heroSubText === "string" ? parsed.heroSubText : DEFAULT_PUBLIC_SETTINGS.heroSubText,
      featuredReleaseId: typeof parsed.featuredReleaseId === "string" ? parsed.featuredReleaseId : null,
      featuredReleaseLabel:
        typeof parsed.featuredReleaseLabel === "string"
          ? parsed.featuredReleaseLabel
          : DEFAULT_PUBLIC_SETTINGS.featuredReleaseLabel,
      featuredReleaseSubLabel:
        typeof parsed.featuredReleaseSubLabel === "string"
          ? parsed.featuredReleaseSubLabel
          : DEFAULT_PUBLIC_SETTINGS.featuredReleaseSubLabel,
      featuredReleaseStatus:
        typeof parsed.featuredReleaseStatus === "string"
          ? parsed.featuredReleaseStatus
          : DEFAULT_PUBLIC_SETTINGS.featuredReleaseStatus,
      discord: typeof parsed.discord === "string" ? parsed.discord : DEFAULT_PUBLIC_SETTINGS.discord,
      instagram: typeof parsed.instagram === "string" ? parsed.instagram : DEFAULT_PUBLIC_SETTINGS.instagram,
      spotify: typeof parsed.spotify === "string" ? parsed.spotify : DEFAULT_PUBLIC_SETTINGS.spotify,
      youtube: typeof parsed.youtube === "string" ? parsed.youtube : DEFAULT_PUBLIC_SETTINGS.youtube,
      twitter: typeof parsed.twitter === "string" ? parsed.twitter : DEFAULT_PUBLIC_SETTINGS.twitter,
      facebook: typeof parsed.facebook === "string" ? parsed.facebook : DEFAULT_PUBLIC_SETTINGS.facebook,
      showStats: typeof parsed.showStats === "boolean" ? parsed.showStats : DEFAULT_PUBLIC_SETTINGS.showStats,
      registrationsOpen:
        typeof parsed.registrationsOpen === "boolean"
          ? parsed.registrationsOpen
          : DEFAULT_PUBLIC_SETTINGS.registrationsOpen,
      maintenanceMode:
        typeof parsed.maintenanceMode === "boolean"
          ? parsed.maintenanceMode
          : DEFAULT_PUBLIC_SETTINGS.maintenanceMode,
      joinHeroTitle:
        typeof parsed.joinHeroTitle === "string" ? parsed.joinHeroTitle : DEFAULT_PUBLIC_SETTINGS.joinHeroTitle,
      joinHeroSub: typeof parsed.joinHeroSub === "string" ? parsed.joinHeroSub : DEFAULT_PUBLIC_SETTINGS.joinHeroSub,
    };
  } catch {
    return { ...DEFAULT_PUBLIC_SETTINGS };
  }
}

const getCachedPublicSettings = unstable_cache(
  async () => {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { config: true },
    });

    return parsePublicSettingsConfig(settings?.config);
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
  return { ...DEFAULT_PUBLIC_SETTINGS };
}
