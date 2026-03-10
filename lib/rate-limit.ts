import { LRUCache } from "lru-cache";

export type RateLimitOptions = {
  interval?: number;
  uniqueTokenPerInterval?: number;
};

export type RateLimitResponse = {
  setHeader?: (name: string, value: number) => void;
} | null;

export type RateLimiter = {
  check: (res: RateLimitResponse, limit: number, token: string) => Promise<void>;
};

export default function rateLimit(options: RateLimitOptions): RateLimiter {
  const tokenCache = new LRUCache<string, [number]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (res, limit, token) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (res && typeof res.setHeader === "function") {
          res.setHeader("X-RateLimit-Limit", limit);
          res.setHeader("X-RateLimit-Remaining", isRateLimited ? 0 : limit - currentUsage);
        }

        return isRateLimited ? reject(new Error("RATE_LIMITED")) : resolve();
      }),
  };
}
