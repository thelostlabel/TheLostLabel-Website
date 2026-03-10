-- CreateTable
CREATE TABLE "ReleaseArtist" (
    "releaseId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "ReleaseArtist_pkey" PRIMARY KEY ("releaseId", "artistId")
);

-- CreateTable
CREATE TABLE "SharedRateLimit" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "dedupeKey" TEXT,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_release_artist_artist_id" ON "ReleaseArtist"("artistId");

-- CreateIndex
CREATE INDEX "idx_release_artist_name" ON "ReleaseArtist"("name");

-- CreateIndex
CREATE INDEX "idx_shared_rate_limit_expires_at" ON "SharedRateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_shared_rate_limit_bucket_token" ON "SharedRateLimit"("bucket", "token");

-- CreateIndex
CREATE INDEX "idx_sync_job_pending" ON "SyncJob"("status", "runAfter", "createdAt");

-- CreateIndex
CREATE INDEX "idx_sync_job_dedupe_key" ON "SyncJob"("dedupeKey");

-- AddForeignKey
ALTER TABLE "ReleaseArtist" ADD CONSTRAINT "ReleaseArtist_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION safe_jsonb_array(input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    IF input IS NULL OR BTRIM(input) = '' THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN input::jsonb;
EXCEPTION WHEN others THEN
    RETURN '[]'::jsonb;
END;
$$;

-- Backfill normalized release artists from existing artistsJson values.
INSERT INTO "ReleaseArtist" ("releaseId", "artistId", "name")
SELECT
    r."id" AS "releaseId",
    COALESCE(NULLIF(TRIM(artist_item ->> 'id'), ''), CONCAT('name:', LOWER(REGEXP_REPLACE(TRIM(COALESCE(artist_item ->> 'name', 'unknown')), '[^a-z0-9]+', '-', 'g')))) AS "artistId",
    NULLIF(TRIM(artist_item ->> 'name'), '') AS "name"
FROM "Release" r
CROSS JOIN LATERAL jsonb_array_elements(safe_jsonb_array(r."artistsJson")) AS artist_item
WHERE jsonb_typeof(safe_jsonb_array(r."artistsJson")) = 'array'
ON CONFLICT ("releaseId", "artistId") DO NOTHING;

DROP FUNCTION safe_jsonb_array(TEXT);
