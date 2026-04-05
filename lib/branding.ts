import type { SystemSettingsConfig } from "./system-settings";

export type BrandingConfig = {
  shortName: string;
  fullName: string;
  dotName: string;
};

const shortName = process.env.NEXT_PUBLIC_SITE_NAME || "LOST";

/** Static env-based branding fallback (build-time / non-DB contexts). */
export const BRANDING: BrandingConfig = {
  shortName,
  fullName: process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL",
  dotName: `${shortName}.`,
};

/**
 * Read branding from DB-backed SystemSettings.
 * Falls back to env-based BRANDING if DB fields are empty.
 */
export function getBrandingFromSettings(config: SystemSettingsConfig): BrandingConfig {
  return {
    shortName: config.brandingShortName || BRANDING.shortName,
    fullName: config.brandingFullName || BRANDING.fullName,
    dotName: config.brandingDotName || BRANDING.dotName,
  };
}
