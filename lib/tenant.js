/**
 * Tenant configuration system.
 * All behavior differences between tenants are controlled via env vars.
 * Never hardcode tenant IDs in feature logic — use feature flags below.
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
