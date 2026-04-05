/**
 * Tenant configuration system.
 *
 * TENANT is a sync env-based fallback for places that can't be async.
 *
 * getActiveTenantConfig() tries:
 * 1. Control DB (if CONTROL_DB_URL is set)
 * 2. SystemSettings from the tenant's own DB (feature flags + branding)
 * 3. Env variables as final fallback
 */

export const TENANT = {
  id: process.env.TENANT_ID || 'lost',
  features: {
    // Homepage — set TENANT_NO_HOME=true to skip homepage and redirect to /dashboard
    homePage: process.env.TENANT_NO_HOME !== 'true',
    // Discord Bridge panel section
    discordBridge: process.env.TENANT_DISCORD !== 'false',
    // Wise payout integration (artist withdrawal system)
    wisePayouts: process.env.TENANT_WISE === 'true',
    // Spotify scraping / listener sync
    spotifySync: process.env.TENANT_SPOTIFY_SYNC !== 'false',
  },
};

/**
 * Async tenant config — reads from Control DB with env fallback.
 * Use this in server components, API routes, and server actions.
 * @example
 *   const config = await getActiveTenantConfig();
 *   if (config.features.wisePayouts) { ... }
 */
export async function getActiveTenantConfig() {
  const { getTenantConfig } = await import('./tenant-config');
  return getTenantConfig(TENANT.id);
}
