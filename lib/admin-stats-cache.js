const CACHE_TTL_MS = 60 * 1000;

let cacheValue = null;
let cacheExpiresAt = 0;
let inflightPromise = null;

export async function getCachedAdminStats(computeFn) {
    const now = Date.now();
    if (cacheValue && now < cacheExpiresAt) {
        return cacheValue;
    }

    if (inflightPromise) {
        return inflightPromise;
    }

    inflightPromise = Promise.resolve()
        .then(() => computeFn())
        .then((nextValue) => {
            cacheValue = nextValue;
            cacheExpiresAt = Date.now() + CACHE_TTL_MS;
            inflightPromise = null;
            return nextValue;
        })
        .catch((error) => {
            inflightPromise = null;
            throw error;
        });

    return inflightPromise;
}

export function clearAdminStatsCache() {
    cacheValue = null;
    cacheExpiresAt = 0;
    inflightPromise = null;
}
