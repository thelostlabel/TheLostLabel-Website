const hasOwn = <T extends object>(obj: T, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

type PermissionOption<K extends string = string> = {
  key: K;
  label: string;
};

export type PermissionMap = Record<string, boolean>;

export type PermissionAwareUser = {
  role?: string | null;
  permissions?: unknown;
};

export const PORTAL_PERMISSION_OPTIONS = [
  { key: "view_overview", label: "OVERVIEW" },
  { key: "view_support", label: "SUPPORT" },
  { key: "view_releases", label: "RELEASES" },
  { key: "view_demos", label: "DEMOS" },
  { key: "view_earnings", label: "EARNINGS" },
  { key: "view_contracts", label: "CONTRACTS" },
  { key: "view_profile", label: "PROFILE" },
  { key: "submit_demos", label: "SUBMIT_DEMO" },
  { key: "request_changes", label: "REQUEST_CHANGE" },
] as const satisfies readonly PermissionOption[];

export const MANAGEMENT_VIEW_PERMISSION_OPTIONS = [
  { key: "admin_view_overview", label: "STATS" },
  { key: "admin_view_submissions", label: "DEMOS" },
  { key: "admin_view_artists", label: "ARTISTS" },
  { key: "admin_view_contracts", label: "CONTRACTS" },
  { key: "admin_view_earnings", label: "EARNINGS" },
  { key: "admin_view_payments", label: "PAYMENTS" },
  { key: "admin_view_releases", label: "RELEASES" },
  { key: "admin_view_requests", label: "REQUESTS" },
  { key: "admin_view_users", label: "USERS" },
  { key: "admin_view_communications", label: "COMMUNICATIONS" },
  { key: "admin_view_content", label: "CONTENT" },
  { key: "admin_view_webhooks", label: "WEBHOOKS" },
  { key: "admin_view_discord_bridge", label: "DISCORD BRIDGE" },
  { key: "admin_view_wise_payouts", label: "WISE PAYOUTS" },
  { key: "admin_view_settings", label: "SETTINGS" },
] as const satisfies readonly PermissionOption[];

export const DEMO_PERMISSION_OPTIONS = [
  { key: "demo_view_all", label: "VIEW ALL DEMOS" },
  { key: "demo_review", label: "MOVE TO REVIEW" },
  { key: "demo_approve", label: "APPROVE DEMO" },
  { key: "demo_reject", label: "REJECT DEMO" },
  { key: "demo_finalize", label: "FINALIZE / CONTRACT" },
  { key: "demo_delete", label: "DELETE DEMO" },
] as const satisfies readonly PermissionOption[];

export const USER_PERMISSION_OPTIONS = [
  { key: "user_view_all", label: "VIEW USERS" },
  { key: "user_edit_profile", label: "EDIT BASIC INFO" },
  { key: "user_manage_status", label: "APPROVE / STATUS" },
  { key: "user_manage_roles", label: "CHANGE ROLE" },
  { key: "user_manage_permissions", label: "EDIT PERMISSIONS" },
  { key: "user_delete", label: "DELETE USER" },
] as const satisfies readonly PermissionOption[];

const MANAGEMENT_PERMISSION_KEYS = new Set<string>([
  ...MANAGEMENT_VIEW_PERMISSION_OPTIONS.map((item) => item.key),
  ...DEMO_PERMISSION_OPTIONS.map((item) => item.key),
  ...USER_PERMISSION_OPTIONS.map((item) => item.key),
]);

export function parsePermissions(value: unknown): PermissionMap {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as PermissionMap;

  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as PermissionMap) : {};
  } catch {
    return {};
  }
}

export function stringifyPermissions(value: unknown): string {
  return JSON.stringify(parsePermissions(value));
}

export function isAdminUser(user: PermissionAwareUser | null | undefined): boolean {
  return user?.role === "admin";
}

export function isARUser(user: PermissionAwareUser | null | undefined): boolean {
  return user?.role === "a&r";
}

export function getExplicitPermission(user: PermissionAwareUser | null | undefined, permission: string): boolean | undefined {
  if (!permission) return undefined;
  const perms = parsePermissions(user?.permissions);
  return hasOwn(perms, permission) ? perms[permission] : undefined;
}

export function hasPortalPermission(user: PermissionAwareUser | null | undefined, permission: string): boolean {
  if (!permission) return true;
  if (isAdminUser(user)) return true;

  const explicit = getExplicitPermission(user, permission);
  return explicit !== false;
}

export function hasStrictPortalPermission(user: PermissionAwareUser | null | undefined, permission: string): boolean {
  if (!permission) return false;
  if (isAdminUser(user)) return true;

  return getExplicitPermission(user, permission) === true;
}

export function hasAdminViewPermission(user: PermissionAwareUser | null | undefined, permission: string): boolean {
  if (!permission) return false;
  if (isAdminUser(user)) return true;

  return getExplicitPermission(user, permission) === true;
}

type ManagementPermissionOptions = {
  fallbackPermissions?: string | string[];
  fallbackAdminView?: string;
  allowRoles?: string | string[];
};

export function hasManagementPermission(
  user: PermissionAwareUser | null | undefined,
  permission: string,
  options: ManagementPermissionOptions = {},
): boolean {
  if (!permission) return false;
  if (isAdminUser(user)) return true;

  const explicit = getExplicitPermission(user, permission);
  if (typeof explicit === "boolean") return explicit;

  const fallbackPermissions = Array.isArray(options.fallbackPermissions)
    ? options.fallbackPermissions
    : options.fallbackPermissions
      ? [options.fallbackPermissions]
      : [];

  for (const fallbackPermission of fallbackPermissions) {
    const fallbackExplicit = getExplicitPermission(user, fallbackPermission);
    if (typeof fallbackExplicit === "boolean") return fallbackExplicit;
    if (hasAdminViewPermission(user, fallbackPermission)) return true;
  }

  if (options.fallbackAdminView && hasAdminViewPermission(user, options.fallbackAdminView)) {
    return true;
  }

  const allowRoles = Array.isArray(options.allowRoles)
    ? options.allowRoles
    : options.allowRoles
      ? [options.allowRoles]
      : [];

  return allowRoles.includes(user?.role ?? "");
}

export function hasManagementAccess(user: PermissionAwareUser | null | undefined): boolean {
  if (isAdminUser(user) || isARUser(user)) return true;

  const perms = parsePermissions(user?.permissions);
  return Array.from(MANAGEMENT_PERMISSION_KEYS).some((key) => perms[key] === true);
}

export function canViewAllDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_view_all", {
    fallbackPermissions: ["demo_review", "demo_approve", "demo_reject", "demo_finalize", "demo_delete"],
    fallbackAdminView: "admin_view_submissions",
  });
}

export function canReviewDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_review", {
    fallbackPermissions: ["demo_view_all"],
    fallbackAdminView: "admin_view_submissions",
  });
}

export function canApproveDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_approve", {
    fallbackPermissions: ["demo_review", "demo_view_all"],
    fallbackAdminView: "admin_view_submissions",
  });
}

export function canRejectDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_reject", {
    fallbackPermissions: ["demo_review", "demo_view_all"],
    fallbackAdminView: "admin_view_submissions",
  });
}

export function canFinalizeDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_finalize", {
    fallbackPermissions: ["demo_approve", "demo_review", "demo_view_all"],
    fallbackAdminView: "admin_view_submissions",
  });
}

export function canDeleteDemos(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "demo_delete");
}

export function canViewUsers(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_view_all", {
    fallbackPermissions: ["user_edit_profile", "user_manage_status", "user_manage_roles", "user_manage_permissions", "user_delete"],
    fallbackAdminView: "admin_view_users",
  });
}

export function canEditUsers(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_edit_profile", {
    fallbackPermissions: ["user_view_all"],
    fallbackAdminView: "admin_view_users",
  });
}

export function canManageUserStatus(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_manage_status");
}

export function canManageUserRoles(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_manage_roles");
}

export function canManageUserPermissions(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_manage_permissions");
}

export function canDeleteUsers(user: PermissionAwareUser | null | undefined): boolean {
  return hasManagementPermission(user, "user_delete");
}

export function canAccessAdminView(
  user: PermissionAwareUser | null | undefined,
  view: string,
  permission: string,
): boolean {
  if (!view) return false;
  if (isAdminUser(user)) return true;

  switch (view) {
    case "submissions":
      return canViewAllDemos(user);
    case "users":
      return canViewUsers(user);
    case "artists":
      return hasAdminViewPermission(user, permission) || canFinalizeDemos(user);
    case "overview":
    case "contracts":
    case "earnings":
    case "payments":
    case "releases":
    case "requests":
    case "communications":
      return isARUser(user) || hasAdminViewPermission(user, permission);
    case "content":
    case "webhooks":
    case "discord-bridge":
    case "settings":
    case "wise-payouts":
      return hasAdminViewPermission(user, permission);
    default:
      return hasAdminViewPermission(user, permission);
  }
}
