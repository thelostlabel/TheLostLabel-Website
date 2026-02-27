const CACHE_TTL_MS = 60 * 1000;

let cacheValue = null;
let cacheExpiresAt = 0;

export async function getCachedAdminStats(computeFn) {
    const now = Date.now();
    if (cacheValue && now < cacheExpiresAt) {
        return cacheValue;
    }

    const nextValue = await computeFn();
    cacheValue = nextValue;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return nextValue;
}

export function clearAdminStatsCache() {
    cacheValue = null;
    cacheExpiresAt = 0;
}
