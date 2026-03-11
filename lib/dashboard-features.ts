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
} as const;

export type AdminDashboardFeatureKey = keyof typeof ADMIN_DASHBOARD_FEATURES;
