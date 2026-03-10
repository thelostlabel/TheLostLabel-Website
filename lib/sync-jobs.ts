import type { SyncJob } from "@prisma/client";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

export const SYNC_JOB_TYPES = {
  playlistSync: "playlist_sync",
  artistStatsSync: "artist_stats_sync",
  artistScrapeBatch: "artist_scrape_batch",
} as const;

type SyncJobType = (typeof SYNC_JOB_TYPES)[keyof typeof SYNC_JOB_TYPES];

type EnqueueSyncJobInput = {
  type: SyncJobType;
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
  maxAttempts?: number;
};

function getInternalBaseUrl() {
  const configured =
    process.env.INTERNAL_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!configured) {
    throw new Error("Missing INTERNAL_APP_URL/NEXTAUTH_URL for sync job runner");
  }

  return configured.replace(/\/+$/, "");
}

function getSyncJobAuthHeader() {
  const token = process.env.CRON_SECRET;
  if (!token) {
    throw new Error("CRON_SECRET is required for sync job runner");
  }

  return `Bearer ${token}`;
}

export async function enqueueSyncJob({ type, payload = {}, dedupeKey = null, maxAttempts = 5 }: EnqueueSyncJobInput) {
  if (dedupeKey) {
    const existing = await prisma.syncJob.findFirst({
      where: {
        dedupeKey,
        status: {
          in: ["pending", "processing"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.syncJob.create({
    data: {
      type,
      payload: payload as Prisma.InputJsonValue,
      dedupeKey,
      maxAttempts,
    },
  });
}

export async function getSyncJob(jobId: string) {
  return prisma.syncJob.findUnique({
    where: { id: jobId },
  });
}

async function claimNextSyncJob() {
  const rows = await prisma.$queryRaw<SyncJob[]>`
    WITH next_job AS (
      SELECT "id"
      FROM "SyncJob"
      WHERE "status" = 'pending'
        AND "runAfter" <= NOW()
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "SyncJob"
    SET
      "status" = 'processing',
      "attempts" = "attempts" + 1,
      "startedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" IN (SELECT "id" FROM next_job)
    RETURNING *
  `;

  return rows[0] || null;
}

async function markSyncJobComplete(jobId: string, result: unknown) {
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      result: result == null ? Prisma.JsonNull : (result as Prisma.InputJsonValue),
      completedAt: new Date(),
      lastError: null,
    },
  });
}

async function markSyncJobFailed(job: SyncJob, error: unknown) {
  const nextAttempt = job.attempts < job.maxAttempts;
  const backoffMs = Math.min(60_000, 5_000 * Math.max(1, job.attempts));

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: nextAttempt ? "pending" : "failed",
      runAfter: nextAttempt ? new Date(Date.now() + backoffMs) : job.runAfter,
      lastError: error instanceof Error ? error.message : String(error),
    },
  });
}

async function dispatchSyncJob(job: SyncJob) {
  const baseUrl = getInternalBaseUrl();
  const authorization = getSyncJobAuthHeader();
  const payload = (job.payload || {}) as Record<string, unknown>;

  let url = "";
  let method: "GET" | "POST" = "GET";

  switch (job.type) {
    case SYNC_JOB_TYPES.playlistSync: {
      const params = new URLSearchParams({
        queue: "false",
      });
      if (payload.scrapeListeners !== undefined) {
        params.set("scrape", payload.scrapeListeners ? "true" : "false");
      }
      if (payload.resultsLimit !== undefined) {
        params.set("resultsLimit", String(payload.resultsLimit));
      }
      url = `${baseUrl}/api/cron/sync-playlist?${params.toString()}`;
      method = "POST";
      break;
    }
    case SYNC_JOB_TYPES.artistStatsSync: {
      url = `${baseUrl}/api/admin/cron/sync-spotify?queue=false`;
      method = "GET";
      break;
    }
    case SYNC_JOB_TYPES.artistScrapeBatch: {
      const params = new URLSearchParams({
        queue: "false",
      });
      if (payload.limit !== undefined) {
        params.set("limit", String(payload.limit));
      }
      if (payload.offset !== undefined) {
        params.set("offset", String(payload.offset));
      }
      url = `${baseUrl}/api/admin/scrape/batch?${params.toString()}`;
      method = "POST";
      break;
    }
    default:
      throw new Error(`Unsupported sync job type: ${job.type}`);
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authorization,
    },
  });

  const result = await response.json().catch(() => ({}));
  const errorMessage =
    result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error
      : null;
  if (!response.ok) {
    throw new Error(errorMessage || `Sync job failed with status ${response.status}`);
  }

  return result;
}

let activeRunner: Promise<void> | null = null;

export async function processSyncJobs(limit = 3) {
  let processed = 0;

  while (processed < limit) {
    const job = await claimNextSyncJob();
    if (!job) {
      break;
    }

    try {
      const result = await dispatchSyncJob(job);
      await markSyncJobComplete(job.id, result);
    } catch (error) {
      await markSyncJobFailed(job, error);
    }

    processed += 1;
  }
}

export function scheduleSyncJobRunner(limit = 3) {
  if (activeRunner) {
    return activeRunner;
  }

  activeRunner = processSyncJobs(limit).finally(() => {
    activeRunner = null;
  });

  return activeRunner;
}
