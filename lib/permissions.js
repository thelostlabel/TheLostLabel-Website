const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const PORTAL_PERMISSION_OPTIONS = [
    { key: "view_overview", label: "OVERVIEW" },
    { key: "view_support", label: "SUPPORT" },
    { key: "view_releases", label: "RELEASES" },
    { key: "view_demos", label: "DEMOS" },
    { key: "view_earnings", label: "EARNINGS" },
    { key: "view_contracts", label: "CONTRACTS" },
    { key: "view_profile", label: "PROFILE" },
    { key: "submit_demos", label: "SUBMIT_DEMO" },
    { key: "request_changes", label: "REQUEST_CHANGE" }
];

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
    { key: "admin_view_settings", label: "SETTINGS" }
];

export const DEMO_PERMISSION_OPTIONS = [
    { key: "demo_view_all", label: "VIEW ALL DEMOS" },
    { key: "demo_review", label: "MOVE TO REVIEW" },
    { key: "demo_approve", label: "APPROVE DEMO" },
    { key: "demo_reject", label: "REJECT DEMO" },
    { key: "demo_finalize", label: "FINALIZE / CONTRACT" },
    { key: "demo_delete", label: "DELETE DEMO" }
];

export const USER_PERMISSION_OPTIONS = [
    { key: "user_view_all", label: "VIEW USERS" },
    { key: "user_edit_profile", label: "EDIT BASIC INFO" },
    { key: "user_manage_status", label: "APPROVE / STATUS" },
    { key: "user_manage_roles", label: "CHANGE ROLE" },
    { key: "user_manage_permissions", label: "EDIT PERMISSIONS" },
    { key: "user_delete", label: "DELETE USER" }
];

const MANAGEMENT_PERMISSION_KEYS = new Set([
    ...MANAGEMENT_VIEW_PERMISSION_OPTIONS.map((item) => item.key),
    ...DEMO_PERMISSION_OPTIONS.map((item) => item.key),
    ...USER_PERMISSION_OPTIONS.map((item) => item.key)
]);

export function parsePermissions(value) {
    if (!value) return {};
    if (typeof value === "object") return value;

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function stringifyPermissions(value) {
    return JSON.stringify(parsePermissions(value));
}

export function isAdminUser(user) {
    return user?.role === "admin";
}

export function isARUser(user) {
    return user?.role === "a&r";
}

export function getExplicitPermission(user, permission) {
    if (!permission) return undefined;
    const perms = parsePermissions(user?.permissions);
    return hasOwn(perms, permission) ? perms[permission] : undefined;
}

export function hasPortalPermission(user, permission) {
    if (!permission) return true;
    if (isAdminUser(user)) return true;

    const explicit = getExplicitPermission(user, permission);
    return explicit !== false;
}

export function hasAdminViewPermission(user, permission) {
    if (!permission) return false;
    if (isAdminUser(user)) return true;

    return getExplicitPermission(user, permission) === true;
}

export function hasManagementPermission(user, permission, options = {}) {
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

    return allowRoles.includes(user?.role);
}

export function hasManagementAccess(user) {
    if (isAdminUser(user) || isARUser(user)) return true;

    const perms = parsePermissions(user?.permissions);
    return Array.from(MANAGEMENT_PERMISSION_KEYS).some((key) => perms[key] === true);
}

export function canViewAllDemos(user) {
    return hasManagementPermission(user, "demo_view_all", {
        fallbackPermissions: ["demo_review", "demo_approve", "demo_reject", "demo_finalize", "demo_delete"],
        fallbackAdminView: "admin_view_submissions"
    });
}

export function canReviewDemos(user) {
    return hasManagementPermission(user, "demo_review", {
        fallbackPermissions: ["demo_view_all"],
        fallbackAdminView: "admin_view_submissions"
    });
}

export function canApproveDemos(user) {
    return hasManagementPermission(user, "demo_approve", {
        fallbackPermissions: ["demo_review", "demo_view_all"],
        fallbackAdminView: "admin_view_submissions"
    });
}

export function canRejectDemos(user) {
    return hasManagementPermission(user, "demo_reject", {
        fallbackPermissions: ["demo_review", "demo_view_all"],
        fallbackAdminView: "admin_view_submissions"
    });
}

export function canFinalizeDemos(user) {
    return hasManagementPermission(user, "demo_finalize", {
        fallbackPermissions: ["demo_approve", "demo_review", "demo_view_all"],
        fallbackAdminView: "admin_view_submissions"
    });
}

export function canDeleteDemos(user) {
    return hasManagementPermission(user, "demo_delete");
}

export function canViewUsers(user) {
    return hasManagementPermission(user, "user_view_all", {
        fallbackPermissions: ["user_edit_profile", "user_manage_status", "user_manage_roles", "user_manage_permissions", "user_delete"],
        fallbackAdminView: "admin_view_users"
    });
}

export function canEditUsers(user) {
    return hasManagementPermission(user, "user_edit_profile", {
        fallbackPermissions: ["user_view_all"],
        fallbackAdminView: "admin_view_users"
    });
}

export function canManageUserStatus(user) {
    return hasManagementPermission(user, "user_manage_status");
}

export function canManageUserRoles(user) {
    return hasManagementPermission(user, "user_manage_roles");
}

export function canManageUserPermissions(user) {
    return hasManagementPermission(user, "user_manage_permissions");
}

export function canDeleteUsers(user) {
    return hasManagementPermission(user, "user_delete");
}
