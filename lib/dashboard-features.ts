import type { SystemSettingsConfig } from "./system-settings";
import type { TenantFeatures } from "./tenant-config";

/**
 * Env-based feature flags (sync, used as fallback and for client-side).
 * Prefer getAdminFeaturesFromSettings() in server-side code.
 */
export const ADMIN_DASHBOARD_FEATURES = {
  discordBridge: process.env.NEXT_PUBLIC_FEATURE_DISCORD !== "false",
  wisePayouts: process.env.NEXT_PUBLIC_FEATURE_WISE === "true",
  submissions: process.env.NEXT_PUBLIC_FEATURE_SUBMISSIONS !== "false",
  contracts: process.env.NEXT_PUBLIC_FEATURE_CONTRACTS !== "false",
  earnings: process.env.NEXT_PUBLIC_FEATURE_EARNINGS !== "false",
  payments: process.env.NEXT_PUBLIC_FEATURE_PAYMENTS !== "false",
  releases: process.env.NEXT_PUBLIC_FEATURE_RELEASES !== "false",
  communications: process.env.NEXT_PUBLIC_FEATURE_COMMS !== "false",
  spotifySync: process.env.NEXT_PUBLIC_FEATURE_SPOTIFY_SYNC !== "false",
  invoices: true,
  announcements: true,
  auditLogs: true,
} as const;

export type AdminDashboardFeatureKey = keyof typeof ADMIN_DASHBOARD_FEATURES;

/**
 * Reads feature flags from SystemSettings (DB-backed, no redeploy needed).
 * Use in server components and API routes.
 */
export function getAdminFeaturesFromSettings(
  config: SystemSettingsConfig,
): Record<AdminDashboardFeatureKey, boolean> {
  return {
    submissions: config.featureSubmissions ?? true,
    contracts: config.featureContracts ?? true,
    earnings: config.featureEarnings ?? true,
    payments: config.featurePayments ?? true,
    releases: config.featureReleases ?? true,
    communications: config.featureCommunications ?? true,
    discordBridge: config.featureDiscordBridge ?? false,
    wisePayouts: config.featureWisePayouts ?? false,
    spotifySync: config.featureSpotifySync ?? true,
    invoices: config.featureInvoices ?? true,
    announcements: config.featureAnnouncements ?? true,
    auditLogs: true,
  };
}

/**
 * Converts TenantFeatures (from control DB) to AdminDashboardFeatures shape.
 * Use this when you have a TenantConfig from getTenantConfig().
 */
export function tenantFeaturesToDashboardFeatures(
  features: TenantFeatures,
): Record<AdminDashboardFeatureKey, boolean> {
  return {
    discordBridge: features.discordBridge,
    wisePayouts: features.wisePayouts,
    submissions: features.submissions,
    contracts: features.contracts,
    earnings: features.earnings,
    payments: features.payments,
    releases: features.releases,
    communications: features.communications,
    spotifySync: features.spotifySync,
    invoices: true,
    announcements: features.announcements,
    auditLogs: true,
  };
}
