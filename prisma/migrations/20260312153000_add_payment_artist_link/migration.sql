ALTER TABLE "Payment" ADD COLUMN "artistId" TEXT;

UPDATE "Payment" p
SET "artistId" = a."id"
FROM "Artist" a
WHERE a."userId" = p."userId"
  AND p."artistId" IS NULL;

CREATE INDEX "idx_payment_artist_id_created_at" ON "Payment"("artistId", "createdAt" DESC);

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
