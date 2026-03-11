import { ADMIN_DASHBOARD_FEATURES } from '@/lib/dashboard-features';
import { getEnabledAdminViews, normalizeAdminView as normalizeSharedAdminView } from '@/lib/dashboard-view-registry';

export function getAdminFeatureFlags() {
    return ADMIN_DASHBOARD_FEATURES;
}

export function getEnabledAdminViewDefinitions() {
    return getEnabledAdminViews(ADMIN_DASHBOARD_FEATURES).map((definition) => ({
        key: definition.view,
        label: definition.displayName,
        permission: definition.perm,
        loaders: definition.loaders,
        dataKey: definition.dataKey,
        alwaysHasData: definition.alwaysHasData
    }));
}

export function getAdminViewDefinition(view) {
    return getEnabledAdminViewDefinitions().find((definition) => definition.key === view) || null;
}

export function normalizeAdminView(rawView) {
    return normalizeSharedAdminView(rawView, ADMIN_DASHBOARD_FEATURES);
}

export function getAdminViewDisplayName(view) {
    return getAdminViewDefinition(view)?.label || "Dashboard";
}

export function getAdminViewPermission(view) {
    return getAdminViewDefinition(view)?.permission || "admin_view_overview";
}

export function getAdminViewLoaders(view) {
    return getAdminViewDefinition(view)?.loaders || [];
}

export function hasAdminViewData(view, state) {
    const definition = getAdminViewDefinition(view);
    if (!definition || definition.alwaysHasData) return true;
    const value = state[definition.dataKey];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
}
