const DEFAULT_PLAYLIST_ID = "6QHy5LPKDRHDdKZGBFxRY8";

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

export type SystemSettingsConfig = PublicSettings & {
  allowCoverArt: boolean;
  allowAudio: boolean;
  allowDelete: boolean;
  allowOther: boolean;
  adminEmail: string;
  defaultPlaylistId: string;
  [key: string]: unknown;
};

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  genres: ["Hip-Hop", "R&B", "Pop", "Electronic", "Phonk", "Brazilian Funk", "Other"],
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ? `${process.env.NEXT_PUBLIC_SITE_NAME} MUSIC` : "LOST MUSIC",
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
  joinHeroTitle: `WORK WITH THE ${process.env.NEXT_PUBLIC_SITE_NAME || "LOST"}. COMPANY`,
  joinHeroSub: "A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS",
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  allowCoverArt: true,
  allowAudio: true,
  allowDelete: true,
  allowOther: true,
  adminEmail: "",
  defaultPlaylistId: DEFAULT_PLAYLIST_ID,
  ...DEFAULT_PUBLIC_SETTINGS,
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const next = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return next.length > 0 ? next : [...fallback];
}

function readString(value: unknown, fallback: string, allowBlank = true) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  if (!normalized && !allowBlank) {
    return fallback;
  }

  return normalized;
}

export function parseSystemSettingsConfig(config: string | null | undefined) {
  if (!config) {
    return {};
  }

  try {
    const parsed = JSON.parse(config) as unknown;
    if (typeof parsed === "string") {
      return parseSystemSettingsConfig(parsed);
    }

    return asRecord(parsed);
  } catch {
    return {};
  }
}

export function normalizeSystemSettingsConfig(input: unknown): SystemSettingsConfig {
  const parsed = typeof input === "string" ? parseSystemSettingsConfig(input) : asRecord(input);
  const {
    allowRegistrations: legacyAllowRegistrations,
    featuredPlaylistId: legacyFeaturedPlaylistId,
    ...rest
  } = parsed;

  const legacyRegistrations =
    typeof legacyAllowRegistrations === "boolean" ? legacyAllowRegistrations : undefined;
  const legacyFeaturedReleaseId =
    typeof legacyFeaturedPlaylistId === "string" ? legacyFeaturedPlaylistId.trim() : "";

  return {
    ...rest,
    ...DEFAULT_SYSTEM_SETTINGS,
    allowCoverArt:
      typeof parsed.allowCoverArt === "boolean"
        ? parsed.allowCoverArt
        : DEFAULT_SYSTEM_SETTINGS.allowCoverArt,
    allowAudio:
      typeof parsed.allowAudio === "boolean" ? parsed.allowAudio : DEFAULT_SYSTEM_SETTINGS.allowAudio,
    allowDelete:
      typeof parsed.allowDelete === "boolean"
        ? parsed.allowDelete
        : DEFAULT_SYSTEM_SETTINGS.allowDelete,
    allowOther:
      typeof parsed.allowOther === "boolean" ? parsed.allowOther : DEFAULT_SYSTEM_SETTINGS.allowOther,
    adminEmail: readString(parsed.adminEmail, DEFAULT_SYSTEM_SETTINGS.adminEmail),
    defaultPlaylistId: readString(parsed.defaultPlaylistId, DEFAULT_SYSTEM_SETTINGS.defaultPlaylistId),
    genres: normalizeStringArray(parsed.genres, DEFAULT_SYSTEM_SETTINGS.genres),
    siteName: readString(parsed.siteName, DEFAULT_SYSTEM_SETTINGS.siteName, false),
    heroText: readString(parsed.heroText, DEFAULT_SYSTEM_SETTINGS.heroText, false),
    heroSubText: readString(parsed.heroSubText, DEFAULT_SYSTEM_SETTINGS.heroSubText, false),
    featuredReleaseId: (() => {
      if (typeof parsed.featuredReleaseId === "string") {
        const value = parsed.featuredReleaseId.trim();
        return value || null;
      }

      return legacyFeaturedReleaseId || DEFAULT_SYSTEM_SETTINGS.featuredReleaseId;
    })(),
    featuredReleaseLabel: readString(
      parsed.featuredReleaseLabel,
      DEFAULT_SYSTEM_SETTINGS.featuredReleaseLabel,
      false,
    ),
    featuredReleaseSubLabel: readString(
      parsed.featuredReleaseSubLabel,
      DEFAULT_SYSTEM_SETTINGS.featuredReleaseSubLabel,
      false,
    ),
    featuredReleaseStatus: readString(
      parsed.featuredReleaseStatus,
      DEFAULT_SYSTEM_SETTINGS.featuredReleaseStatus,
      false,
    ),
    discord: readString(parsed.discord, DEFAULT_SYSTEM_SETTINGS.discord),
    instagram: readString(parsed.instagram, DEFAULT_SYSTEM_SETTINGS.instagram),
    spotify: readString(parsed.spotify, DEFAULT_SYSTEM_SETTINGS.spotify),
    youtube: readString(parsed.youtube, DEFAULT_SYSTEM_SETTINGS.youtube),
    twitter: readString(parsed.twitter, DEFAULT_SYSTEM_SETTINGS.twitter),
    facebook: readString(parsed.facebook, DEFAULT_SYSTEM_SETTINGS.facebook),
    showStats:
      typeof parsed.showStats === "boolean" ? parsed.showStats : DEFAULT_SYSTEM_SETTINGS.showStats,
    registrationsOpen:
      typeof parsed.registrationsOpen === "boolean"
        ? parsed.registrationsOpen
        : legacyRegistrations ?? DEFAULT_SYSTEM_SETTINGS.registrationsOpen,
    maintenanceMode:
      typeof parsed.maintenanceMode === "boolean"
        ? parsed.maintenanceMode
        : DEFAULT_SYSTEM_SETTINGS.maintenanceMode,
    joinHeroTitle: readString(parsed.joinHeroTitle, DEFAULT_SYSTEM_SETTINGS.joinHeroTitle, false),
    joinHeroSub: readString(parsed.joinHeroSub, DEFAULT_SYSTEM_SETTINGS.joinHeroSub, false),
  };
}

export function pickPublicSettings(input: unknown): PublicSettings {
  const normalized = normalizeSystemSettingsConfig(input);

  return {
    genres: [...normalized.genres],
    siteName: normalized.siteName,
    heroText: normalized.heroText,
    heroSubText: normalized.heroSubText,
    featuredReleaseId: normalized.featuredReleaseId,
    featuredReleaseLabel: normalized.featuredReleaseLabel,
    featuredReleaseSubLabel: normalized.featuredReleaseSubLabel,
    featuredReleaseStatus: normalized.featuredReleaseStatus,
    discord: normalized.discord,
    instagram: normalized.instagram,
    spotify: normalized.spotify,
    youtube: normalized.youtube,
    twitter: normalized.twitter,
    facebook: normalized.facebook,
    showStats: normalized.showStats,
    registrationsOpen: normalized.registrationsOpen,
    maintenanceMode: normalized.maintenanceMode,
    joinHeroTitle: normalized.joinHeroTitle,
    joinHeroSub: normalized.joinHeroSub,
  };
}

export function getDefaultSystemSettings() {
  return normalizeSystemSettingsConfig(DEFAULT_SYSTEM_SETTINGS);
}
