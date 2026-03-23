-- CreateTable
CREATE TABLE "EmailDeliveryLog" (
    "id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "fromEmail" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "providerMessageId" TEXT,
    "providerResponse" TEXT,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_email_delivery_log_status_created_at" ON "EmailDeliveryLog"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_email_delivery_log_to_email_created_at" ON "EmailDeliveryLog"("toEmail", "createdAt" DESC);
