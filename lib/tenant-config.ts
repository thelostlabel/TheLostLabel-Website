/**
 * Tenant config fetcher.
 * Reads branding + feature flags from the Control DB.
 * Falls back to env variables if CONTROL_DB_URL is not set.
 */

import { controlDb } from "./control-db";

export type TenantBranding = {
  shortName: string;
  fullName: string;
  dotName: string;
  primaryColor: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  supportEmail: string;
};

export type TenantFeatures = {
  homePage: boolean;
  discordBridge: boolean;
  wisePayouts: boolean;
  spotifySync: boolean;
  submissions: boolean;
  contracts: boolean;
  earnings: boolean;
  payments: boolean;
  releases: boolean;
  communications: boolean;
  invoices: boolean;
  announcements: boolean;
};

export type TenantConfig = {
  slug: string;
  name: string;
  isActive: boolean;
  branding: TenantBranding;
  features: TenantFeatures;
};

// In-memory cache: slug → { config, fetchedAt }
const cache = new Map<string, { config: TenantConfig; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika

function getEnvFallback(slug: string): TenantConfig {
  const shortName = process.env.NEXT_PUBLIC_SITE_NAME || "LOST";
  const fullName = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL";

  return {
    slug,
    name: fullName,
    isActive: true,
    branding: {
      shortName,
      fullName,
      dotName: `${shortName}.`,
      primaryColor: "#ffffff",
      logoUrl: null,
      bannerUrl: process.env.NEXT_PUBLIC_BANNER_PATH || "/lostbanner.png",
      supportEmail: process.env.SUPPORT_EMAIL || "",
    },
    features: {
      homePage: process.env.TENANT_NO_HOME !== "true",
      discordBridge: process.env.TENANT_DISCORD !== "false",
      wisePayouts: process.env.TENANT_WISE === "true",
      spotifySync: process.env.TENANT_SPOTIFY_SYNC !== "false",
      submissions: process.env.NEXT_PUBLIC_FEATURE_SUBMISSIONS !== "false",
      contracts: process.env.NEXT_PUBLIC_FEATURE_CONTRACTS !== "false",
      earnings: process.env.NEXT_PUBLIC_FEATURE_EARNINGS !== "false",
      payments: process.env.NEXT_PUBLIC_FEATURE_PAYMENTS !== "false",
      releases: process.env.NEXT_PUBLIC_FEATURE_RELEASES !== "false",
      communications: process.env.NEXT_PUBLIC_FEATURE_COMMS !== "false",
      invoices: true,
      announcements: true,
    },
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function parseBranding(raw: unknown, slug: string): TenantBranding {
  const r = asRecord(raw);
  const shortName = typeof r.shortName === "string" ? r.shortName : slug.toUpperCase();
  return {
    shortName,
    fullName: typeof r.fullName === "string" ? r.fullName : shortName,
    dotName: typeof r.dotName === "string" ? r.dotName : `${shortName}.`,
    primaryColor: typeof r.primaryColor === "string" ? r.primaryColor : "#ffffff",
    logoUrl: typeof r.logoUrl === "string" ? r.logoUrl : null,
    bannerUrl: typeof r.bannerUrl === "string" ? r.bannerUrl : null,
    supportEmail: typeof r.supportEmail === "string" ? r.supportEmail : "",
  };
}

function parseFeatures(raw: unknown): TenantFeatures {
  const r = asRecord(raw);
  const bool = (key: string, def: boolean) =>
    typeof r[key] === "boolean" ? (r[key] as boolean) : def;
  return {
    homePage: bool("homePage", true),
    discordBridge: bool("discordBridge", true),
    wisePayouts: bool("wisePayouts", false),
    spotifySync: bool("spotifySync", true),
    submissions: bool("submissions", true),
    contracts: bool("contracts", true),
    earnings: bool("earnings", true),
    payments: bool("payments", true),
    releases: bool("releases", true),
    communications: bool("communications", true),
    invoices: bool("invoices", true),
    announcements: bool("announcements", true),
  };
}

export async function getTenantConfig(slug: string): Promise<TenantConfig> {
  // Cache kontrolü
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.config;
  }

  // Control DB yoksa env fallback
  if (!controlDb) {
    return getEnvFallback(slug);
  }

  try {
    const tenant = await controlDb.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      console.warn(`[tenant-config] Tenant "${slug}" not found in control DB, using env fallback`);
      return getEnvFallback(slug);
    }

    const config: TenantConfig = {
      slug: tenant.slug,
      name: tenant.name,
      isActive: tenant.isActive,
      branding: parseBranding(tenant.branding, tenant.slug),
      features: parseFeatures(tenant.features),
    };

    cache.set(slug, { config, fetchedAt: Date.now() });
    return config;
  } catch (err) {
    console.error("[tenant-config] Control DB error, using env fallback:", err);
    return getEnvFallback(slug);
  }
}

/** Cache'i temizle (control panel'den değişiklik yapılınca çağrılır) */
export function invalidateTenantCache(slug?: string) {
  if (slug) {
    cache.delete(slug);
  } else {
    cache.clear();
  }
}
