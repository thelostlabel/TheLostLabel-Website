import { ADMIN_DASHBOARD_FEATURES } from '@/lib/dashboard-features';
import {
    getAdminViewDefinition as getSharedAdminViewDefinition,
    getAdminViewDisplayName as getSharedAdminViewDisplayName,
    getAdminViewLoaders as getSharedAdminViewLoaders,
    getAdminViewPermission as getSharedAdminViewPermission,
    getEnabledAdminViews,
    normalizeAdminView as normalizeSharedAdminView
} from '@/lib/dashboard-view-registry';

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

export function getAdminViewDefinition(view: string) {
    const def = getSharedAdminViewDefinition(view);
    if (!def) return null;
    return {
        key: def.view,
        label: def.displayName,
        permission: def.perm,
        loaders: def.loaders,
        dataKey: def.dataKey,
        alwaysHasData: def.alwaysHasData
    };
}

export function normalizeAdminView(rawView: string) {
    return normalizeSharedAdminView(rawView, ADMIN_DASHBOARD_FEATURES);
}

export function getAdminViewDisplayName(view: string) {
    return getSharedAdminViewDisplayName(view);
}

export function getAdminViewPermission(view: string) {
    return getSharedAdminViewPermission(view);
}

export function getAdminViewLoaders(view: string) {
    return getSharedAdminViewLoaders(view);
}

export function hasAdminViewData(view: string, state: Record<string, unknown>) {
    const definition = getAdminViewDefinition(view);
    if (!definition || definition.alwaysHasData) return true;
    if (!definition.dataKey) return true;
    const value = state[definition.dataKey];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
}
