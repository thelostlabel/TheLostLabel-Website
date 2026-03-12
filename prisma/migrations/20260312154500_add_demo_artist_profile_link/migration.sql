ALTER TABLE "Demo" ADD COLUMN "artistProfileId" TEXT;

UPDATE "Demo" d
SET "artistProfileId" = a."id"
FROM "Artist" a
WHERE a."userId" = d."artistId"
  AND d."artistProfileId" IS NULL;

CREATE INDEX "idx_demo_artist_profile_id_created_at" ON "Demo"("artistProfileId", "createdAt" DESC);

ALTER TABLE "Demo"
ADD CONSTRAINT "Demo_artistProfileId_fkey"
FOREIGN KEY ("artistProfileId") REFERENCES "Artist"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
