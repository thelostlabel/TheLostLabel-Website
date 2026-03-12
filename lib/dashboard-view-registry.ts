import type { AdminDashboardFeatureKey } from "@/lib/dashboard-features";

export type AdminViewKey =
  | "overview"
  | "submissions"
  | "artists"
  | "users"
  | "requests"
  | "content"
  | "webhooks"
  | "settings"
  | "contracts"
  | "earnings"
  | "payments"
  | "releases"
  | "communications"
  | "discord-bridge"
  | "wise-payouts";

export type PortalViewKey =
  | "overview"
  | "releases"
  | "demos"
  | "submit"
  | "earnings"
  | "contracts"
  | "support"
  | "profile"
  | "project";

export const ADMIN_VIEW_ALIASES: Record<string, AdminViewKey> = {
  submit: "submissions",
};

export const ADMIN_VIEW_DEFINITIONS: Array<{
  view: AdminViewKey;
  navLabel: string;
  displayName: string;
  iconKey: string;
  perm: string;
  featureKey?: AdminDashboardFeatureKey;
  access?: "all-demos" | "users" | "admin";
  loaders: string[];
  dataKey?: string;
  alwaysHasData?: boolean;
}> = [
  { view: "overview", navLabel: "OVERVIEW", displayName: "Overview", iconKey: "layout-dashboard", perm: "admin_view_overview", access: "admin", loaders: [], alwaysHasData: true },
  { view: "submissions", navLabel: "SUBMISSIONS", displayName: "Submissions", iconKey: "inbox", perm: "admin_view_submissions", featureKey: "submissions", access: "all-demos", loaders: ["submissions"], dataKey: "submissions" },
  { view: "artists", navLabel: "ARTISTS", displayName: "Artists", iconKey: "mic-2", perm: "admin_view_artists", access: "admin", loaders: ["artists", "users", "releases", "contracts"], dataKey: "artists" },
  { view: "contracts", navLabel: "CONTRACTS", displayName: "Contracts", iconKey: "briefcase", perm: "admin_view_contracts", featureKey: "contracts", access: "admin", loaders: ["contracts", "artists", "releases", "submissions"], dataKey: "contracts" },
  { view: "earnings", navLabel: "EARNINGS", displayName: "Earnings", iconKey: "dollar-sign", perm: "admin_view_earnings", featureKey: "earnings", access: "admin", loaders: ["earnings", "contracts"], dataKey: "earnings" },
  { view: "payments", navLabel: "PAYMENTS", displayName: "Payments", iconKey: "credit-card", perm: "admin_view_payments", featureKey: "payments", access: "admin", loaders: ["payments", "users"], dataKey: "payments" },
  { view: "releases", navLabel: "RELEASES", displayName: "Releases", iconKey: "disc", perm: "admin_view_releases", featureKey: "releases", access: "admin", loaders: ["releases"], dataKey: "releases" },
  { view: "requests", navLabel: "REQUESTS", displayName: "Requests", iconKey: "file-text", perm: "admin_view_requests", access: "admin", loaders: ["requests"], dataKey: "requests" },
  { view: "users", navLabel: "USERS", displayName: "Users", iconKey: "users", perm: "admin_view_users", access: "users", loaders: ["users"], dataKey: "users" },
  { view: "communications", navLabel: "COMMUNICATIONS", displayName: "Communications", iconKey: "mail", perm: "admin_view_communications", featureKey: "communications", access: "admin", loaders: ["artists"], dataKey: "artists" },
  { view: "content", navLabel: "CONTENT", displayName: "Content", iconKey: "file", perm: "admin_view_content", access: "admin", loaders: ["content"], dataKey: "siteContent" },
  { view: "webhooks", navLabel: "WEBHOOKS", displayName: "Webhooks", iconKey: "bell", perm: "admin_view_webhooks", access: "admin", loaders: ["webhooks"], dataKey: "webhooks" },
  { view: "discord-bridge", navLabel: "DISCORD BRIDGE", displayName: "Discord Bridge", iconKey: "bot", perm: "admin_view_discord_bridge", featureKey: "discordBridge", access: "admin", loaders: ["discordBridge"], dataKey: "discordBridge" },
  { view: "wise-payouts", navLabel: "WISE PAYOUTS", displayName: "Wise Payouts", iconKey: "credit-card", perm: "admin_view_wise_payouts", featureKey: "wisePayouts", access: "admin", loaders: [], alwaysHasData: true },
  { view: "settings", navLabel: "SETTINGS", displayName: "Settings", iconKey: "settings", perm: "admin_view_settings", access: "admin", loaders: [], alwaysHasData: true },
];

export const PORTAL_VIEW_DEFINITIONS: Array<{
  view: PortalViewKey;
  routeView: string;
  navLabel: string;
  title: string;
  iconKey: string;
  perm: string;
  hidden?: boolean;
}> = [
  { view: "overview", routeView: "my-overview", navLabel: "MY OVERVIEW", title: "OVERVIEW", iconKey: "layout-dashboard", perm: "view_overview" },
  { view: "releases", routeView: "my-releases", navLabel: "MY RELEASES", title: "MY RELEASES", iconKey: "disc", perm: "view_releases" },
  { view: "demos", routeView: "my-demos", navLabel: "MY DEMOS", title: "MY DEMOS", iconKey: "music", perm: "view_demos" },
  { view: "submit", routeView: "my-submit", navLabel: "NEW SUBMISSION", title: "NEW SUBMISSION", iconKey: "upload", perm: "submit_demos" },
  { view: "earnings", routeView: "my-earnings", navLabel: "EARNINGS", title: "MY EARNINGS", iconKey: "dollar-sign", perm: "view_earnings" },
  { view: "contracts", routeView: "my-contracts", navLabel: "CONTRACTS", title: "MY CONTRACTS", iconKey: "briefcase", perm: "view_contracts" },
  { view: "support", routeView: "my-support", navLabel: "SUPPORT", title: "SUPPORT", iconKey: "inbox", perm: "view_support" },
  { view: "profile", routeView: "my-profile", navLabel: "MY PROFILE", title: "MY PROFILE", iconKey: "user", perm: "view_profile" },
  { view: "project", routeView: "my-project", navLabel: "PROJECT", title: "PROJECT", iconKey: "file-text", perm: "view_demos", hidden: true },
];

export function getAdminViewDefinition(view: string | null | undefined) {
  return ADMIN_VIEW_DEFINITIONS.find((item) => item.view === view) || null;
}

export function getAdminViewPermission(view: string | null | undefined) {
  return getAdminViewDefinition(view)?.perm || "admin_view_overview";
}

export function getAdminViewDisplayName(view: string | null | undefined) {
  return getAdminViewDefinition(view)?.displayName || "Dashboard";
}

export function getAdminViewLoaders(view: string | null | undefined) {
  return getAdminViewDefinition(view)?.loaders || [];
}

export function getPortalViewDefinition(view: string | null | undefined) {
  return PORTAL_VIEW_DEFINITIONS.find((item) => item.view === view) || null;
}

export function getPortalViewTitle(view: string | null | undefined) {
  return getPortalViewDefinition(view)?.title || "DASHBOARD";
}

export function isAdminDashboardView(view: string | null | undefined) {
  return Boolean(getAdminViewDefinition(view));
}

export function getEnabledAdminViews(features: Partial<Record<AdminDashboardFeatureKey, boolean>>) {
  return ADMIN_VIEW_DEFINITIONS.filter((item) => {
    if (!item.featureKey) {
      return true;
    }

    return features[item.featureKey] !== false;
  });
}

export function normalizeAdminView(
  rawView: string | null | undefined,
  features: Partial<Record<AdminDashboardFeatureKey, boolean>>,
) {
  const candidate = ADMIN_VIEW_ALIASES[String(rawView || "").trim()] || (rawView as AdminViewKey);
  const enabledViews = getEnabledAdminViews(features);
  return enabledViews.some((item) => item.view === candidate) ? candidate : "overview";
}

export function normalizePortalView(rawView: string | null | undefined) {
  const candidate = String(rawView || "overview").trim();
  const normalized = candidate.startsWith("my-") ? candidate.slice(3) : candidate;
  return PORTAL_VIEW_DEFINITIONS.some((item) => item.view === normalized) ? (normalized as PortalViewKey) : "overview";
}
