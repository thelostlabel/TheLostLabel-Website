-- CreateTable
CREATE TABLE "BalanceAdjustment" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_balance_adjustment_artist_id_created_at" ON "BalanceAdjustment"("artistId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_balance_adjustment_user_id_created_at" ON "BalanceAdjustment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_balance_adjustment_created_by_created_at" ON "BalanceAdjustment"("createdById", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "BalanceAdjustment" ADD CONSTRAINT "BalanceAdjustment_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceAdjustment" ADD CONSTRAINT "BalanceAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceAdjustment" ADD CONSTRAINT "BalanceAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

