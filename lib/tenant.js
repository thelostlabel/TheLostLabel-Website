/**
 * Tenant configuration system.
 * Feature flags are read from the Control DB (CONTROL_DB_URL) at runtime.
 * If CONTROL_DB_URL is not set, falls back to env variables.
 * Use getTenantConfig() for async/server contexts.
 * TENANT below is a sync env-based fallback for places that can't be async.
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
