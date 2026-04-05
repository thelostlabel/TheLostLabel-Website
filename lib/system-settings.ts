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
  // Branding (DB-backed)
  brandingShortName: string;
  brandingFullName: string;
  brandingDotName: string;
  brandingPrimaryColor: string;
  brandingLogoUrl: string;
  brandingSupportEmail: string;
  // Feature flags (DB-backed)
  featureSubmissions: boolean;
  featureContracts: boolean;
  featureEarnings: boolean;
  featurePayments: boolean;
  featureReleases: boolean;
  featureCommunications: boolean;
  featureDiscordBridge: boolean;
  featureWisePayouts: boolean;
  featureSpotifySync: boolean;
  featureInvoices: boolean;
  featureAnnouncements: boolean;
};

export type SystemSettingsConfig = PublicSettings & {
  allowCoverArt: boolean;
  allowAudio: boolean;
  allowDelete: boolean;
  allowOther: boolean;
  adminEmail: string;
  defaultPlaylistId: string;
  // Feature flags — managed from admin settings, no redeploy needed
  featureSubmissions: boolean;
  featureContracts: boolean;
  featureEarnings: boolean;
  featurePayments: boolean;
  featureReleases: boolean;
  featureCommunications: boolean;
  featureDiscordBridge: boolean;
  featureWisePayouts: boolean;
  featureSpotifySync: boolean;
  featureInvoices: boolean;
  featureAnnouncements: boolean;
  // Branding — managed from admin settings, no redeploy needed
  brandingShortName: string;
  brandingFullName: string;
  brandingDotName: string;
  brandingPrimaryColor: string;
  brandingLogoUrl: string;
  brandingSupportEmail: string;
  [key: string]: unknown;
};

const envShortName = process.env.NEXT_PUBLIC_SITE_NAME || "LOST";

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
  joinHeroTitle: `WORK WITH THE ${envShortName}. COMPANY`,
  joinHeroSub: "A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS",
  brandingShortName: envShortName,
  brandingFullName: process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL",
  brandingDotName: `${envShortName}.`,
  brandingPrimaryColor: "#ffffff",
  brandingLogoUrl: "",
  brandingSupportEmail: process.env.SUPPORT_EMAIL || "",
  featureSubmissions: true,
  featureContracts: true,
  featureEarnings: true,
  featurePayments: true,
  featureReleases: true,
  featureCommunications: true,
  featureDiscordBridge: process.env.NEXT_PUBLIC_FEATURE_DISCORD !== "false",
  featureWisePayouts: process.env.NEXT_PUBLIC_FEATURE_WISE === "true",
  featureSpotifySync: true,
  featureInvoices: true,
  featureAnnouncements: true,
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  ...DEFAULT_PUBLIC_SETTINGS,
  allowCoverArt: true,
  allowAudio: true,
  allowDelete: true,
  allowOther: true,
  adminEmail: "",
  defaultPlaylistId: DEFAULT_PLAYLIST_ID,
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
    // Feature flags
    featureSubmissions:
      typeof parsed.featureSubmissions === "boolean" ? parsed.featureSubmissions : DEFAULT_SYSTEM_SETTINGS.featureSubmissions,
    featureContracts:
      typeof parsed.featureContracts === "boolean" ? parsed.featureContracts : DEFAULT_SYSTEM_SETTINGS.featureContracts,
    featureEarnings:
      typeof parsed.featureEarnings === "boolean" ? parsed.featureEarnings : DEFAULT_SYSTEM_SETTINGS.featureEarnings,
    featurePayments:
      typeof parsed.featurePayments === "boolean" ? parsed.featurePayments : DEFAULT_SYSTEM_SETTINGS.featurePayments,
    featureReleases:
      typeof parsed.featureReleases === "boolean" ? parsed.featureReleases : DEFAULT_SYSTEM_SETTINGS.featureReleases,
    featureCommunications:
      typeof parsed.featureCommunications === "boolean" ? parsed.featureCommunications : DEFAULT_SYSTEM_SETTINGS.featureCommunications,
    featureDiscordBridge:
      typeof parsed.featureDiscordBridge === "boolean" ? parsed.featureDiscordBridge : DEFAULT_SYSTEM_SETTINGS.featureDiscordBridge,
    featureWisePayouts:
      typeof parsed.featureWisePayouts === "boolean" ? parsed.featureWisePayouts : DEFAULT_SYSTEM_SETTINGS.featureWisePayouts,
    featureSpotifySync:
      typeof parsed.featureSpotifySync === "boolean" ? parsed.featureSpotifySync : DEFAULT_SYSTEM_SETTINGS.featureSpotifySync,
    featureInvoices:
      typeof parsed.featureInvoices === "boolean" ? parsed.featureInvoices : DEFAULT_SYSTEM_SETTINGS.featureInvoices,
    featureAnnouncements:
      typeof parsed.featureAnnouncements === "boolean" ? parsed.featureAnnouncements : DEFAULT_SYSTEM_SETTINGS.featureAnnouncements,
    // Branding
    brandingShortName: readString(parsed.brandingShortName, DEFAULT_SYSTEM_SETTINGS.brandingShortName, false),
    brandingFullName: readString(parsed.brandingFullName, DEFAULT_SYSTEM_SETTINGS.brandingFullName, false),
    brandingDotName: readString(parsed.brandingDotName, DEFAULT_SYSTEM_SETTINGS.brandingDotName, false),
    brandingPrimaryColor: readString(parsed.brandingPrimaryColor, DEFAULT_SYSTEM_SETTINGS.brandingPrimaryColor),
    brandingLogoUrl: readString(parsed.brandingLogoUrl, DEFAULT_SYSTEM_SETTINGS.brandingLogoUrl),
    brandingSupportEmail: readString(parsed.brandingSupportEmail, DEFAULT_SYSTEM_SETTINGS.brandingSupportEmail),
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
    brandingShortName: normalized.brandingShortName,
    brandingFullName: normalized.brandingFullName,
    brandingDotName: normalized.brandingDotName,
    brandingPrimaryColor: normalized.brandingPrimaryColor,
    brandingLogoUrl: normalized.brandingLogoUrl,
    brandingSupportEmail: normalized.brandingSupportEmail,
    featureSubmissions: normalized.featureSubmissions,
    featureContracts: normalized.featureContracts,
    featureEarnings: normalized.featureEarnings,
    featurePayments: normalized.featurePayments,
    featureReleases: normalized.featureReleases,
    featureCommunications: normalized.featureCommunications,
    featureDiscordBridge: normalized.featureDiscordBridge,
    featureWisePayouts: normalized.featureWisePayouts,
    featureSpotifySync: normalized.featureSpotifySync,
    featureInvoices: normalized.featureInvoices,
    featureAnnouncements: normalized.featureAnnouncements,
  };
}

export function getDefaultSystemSettings() {
  return normalizeSystemSettingsConfig(DEFAULT_SYSTEM_SETTINGS);
}
