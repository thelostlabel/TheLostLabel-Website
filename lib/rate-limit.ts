import { LRUCache } from "lru-cache";

import prisma from "@/lib/prisma";

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
  const interval = options.interval || 60000;
  const tokenCache = new LRUCache<string, [number]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: interval,
  });

  const checkInMemory = (res: RateLimitResponse, limit: number, token: string) =>
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
        res.setHeader("X-RateLimit-Remaining", isRateLimited ? 0 : Math.max(0, limit - currentUsage));
      }

      return isRateLimited ? reject(new Error("RATE_LIMITED")) : resolve();
    });

  return {
    check: async (res, limit, token) => {
      const now = Date.now();
      const bucketStart = Math.floor(now / interval) * interval;
      const bucket = `${interval}:${bucketStart}`;
      const id = `${bucket}:${token}`;
      const expiresAt = new Date(bucketStart + interval * 2);

      try {
        const entry = await prisma.sharedRateLimit.upsert({
          where: { id },
          update: {
            count: { increment: 1 },
            expiresAt,
          },
          create: {
            id,
            bucket,
            token,
            expiresAt,
          },
          select: { count: true },
        });

        if (res && typeof res.setHeader === "function") {
          res.setHeader("X-RateLimit-Limit", limit);
          res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - entry.count));
        }

        if (entry.count >= limit) {
          throw new Error("RATE_LIMITED");
        }

        void prisma.sharedRateLimit
          .deleteMany({
            where: {
              expiresAt: {
                lt: new Date(now - interval),
              },
            },
          })
          .catch(() => {});
      } catch (error) {
        if (error instanceof Error && error.message === "RATE_LIMITED") {
          throw error;
        }

        await checkInMemory(res, limit, token);
      }
    },
  };
}
