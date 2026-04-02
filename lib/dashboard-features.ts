import type { TenantFeatures } from "./tenant-config";

/**
 * Env-based feature flags (sync, used as fallback and for client-side).
 * For server-side use getActiveTenantConfig() from lib/tenant.js instead.
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
  announcements: true,
  auditLogs: true,
} as const;

export type AdminDashboardFeatureKey = keyof typeof ADMIN_DASHBOARD_FEATURES;

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
    announcements: features.announcements,
    auditLogs: true,
  };
}
