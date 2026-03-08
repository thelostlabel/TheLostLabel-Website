-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "stageName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'artist',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monthlyListeners" INTEGER,
    "spotifyUrl" TEXT,
    "permissions" TEXT,
    "legalName" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "emailVerified" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "notifyContracts" BOOLEAN NOT NULL DEFAULT true,
    "notifyDemos" BOOLEAN NOT NULL DEFAULT true,
    "notifyEarnings" BOOLEAN NOT NULL DEFAULT true,
    "notifySupport" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "discordId" TEXT,
    "discordNotifyEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "trackLink" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "artistId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "scheduledReleaseDate" TEXT,
    "featuredArtists" TEXT,

    CONSTRAINT "Demo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoId" TEXT NOT NULL,

    CONSTRAINT "DemoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "config" TEXT,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "spotifyUrl" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "followers" INTEGER DEFAULT 0,
    "genres" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "monthlyListeners" INTEGER DEFAULT 0,
    "verified" BOOLEAN DEFAULT false,
    "popularity" INTEGER DEFAULT 0,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistStatsHistory" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "monthlyListeners" INTEGER NOT NULL,
    "followers" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "popularity" INTEGER,

    CONSTRAINT "ArtistStatsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistName" TEXT,
    "image" TEXT,
    "spotifyUrl" TEXT,
    "releaseDate" TEXT,
    "artistsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "popularity" INTEGER,
    "streamCountText" TEXT,
    "type" TEXT NOT NULL DEFAULT 'album',
    "totalTracks" INTEGER NOT NULL DEFAULT 1,
    "previewUrl" TEXT,
    "baseTitle" TEXT,
    "versionName" TEXT,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "details" TEXT,
    "adminNote" TEXT,
    "filesJson" TEXT,
    "releaseId" TEXT,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequestComment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeRequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "config" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT,
    "userId" TEXT,
    "artistId" TEXT,
    "primaryArtistName" TEXT,
    "primaryArtistEmail" TEXT,
    "title" TEXT,
    "demoId" TEXT,
    "artistShare" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "labelShare" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "status" TEXT NOT NULL DEFAULT 'active',
    "signedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "featuredArtists" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoyaltySplit" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "artistId" TEXT,
    "email" TEXT,

    CONSTRAINT "RoyaltySplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earning" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "artistAmount" DOUBLE PRECISION NOT NULL,
    "labelAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "streams" INTEGER,
    "source" TEXT,
    "expenseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidToArtist" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_account_links" (
    "user_id" TEXT NOT NULL,
    "discord_user_id" TEXT NOT NULL,
    "discord_username" TEXT,
    "discord_avatar" TEXT,
    "guild_id" TEXT,
    "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_account_links_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "discord_event_outbox" (
    "id" BIGSERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_id" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_internal_audit" (
    "id" BIGSERIAL NOT NULL,
    "request_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "discord_user_id" TEXT,
    "guild_id" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "status_code" INTEGER,
    "signature" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_internal_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_oauth_states" (
    "state" TEXT NOT NULL,
    "user_id" TEXT,
    "discord_user_id" TEXT,
    "discord_username" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "discord_oauth_states_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "discord_role_sync_queue" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "discord_user_id" TEXT,
    "target_role" TEXT NOT NULL,
    "target_discord_role_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "guild_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_role_sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_demo_artist_id_created_at" ON "Demo"("artistId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_demo_status_created_at" ON "Demo"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_userId_key" ON "Artist"("userId");

-- CreateIndex
CREATE INDEX "ArtistStatsHistory_artistId_date_idx" ON "ArtistStatsHistory"("artistId", "date");

-- CreateIndex
CREATE INDEX "Release_baseTitle_idx" ON "Release"("baseTitle");

-- CreateIndex
CREATE INDEX "idx_change_request_assigned_to_created_at" ON "ChangeRequest"("assignedToId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_change_request_status_created_at" ON "ChangeRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_change_request_user_id_created_at" ON "ChangeRequest"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_demoId_key" ON "Contract"("demoId");

-- CreateIndex
CREATE INDEX "idx_contract_artist_id_created_at" ON "Contract"("artistId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_contract_release_id" ON "Contract"("releaseId");

-- CreateIndex
CREATE INDEX "idx_contract_status_created_at" ON "Contract"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_contract_user_id_created_at" ON "Contract"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_earning_contract_id_period" ON "Earning"("contractId", "period" DESC);

-- CreateIndex
CREATE INDEX "idx_earning_created_at" ON "Earning"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_status_created_at" ON "Payment"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_user_id_created_at" ON "Payment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "discord_account_links_discord_user_id_key" ON "discord_account_links"("discord_user_id");

-- CreateIndex
CREATE INDEX "idx_discord_account_links_discord_user_id" ON "discord_account_links"("discord_user_id");

-- CreateIndex
CREATE INDEX "idx_discord_event_outbox_pending" ON "discord_event_outbox"("status", "next_attempt_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_discord_internal_audit_created_at" ON "discord_internal_audit"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_discord_internal_audit_request_id" ON "discord_internal_audit"("request_id");

-- CreateIndex
CREATE INDEX "idx_discord_internal_audit_signature" ON "discord_internal_audit"("signature");

-- CreateIndex
CREATE INDEX "idx_discord_oauth_states_expires_at" ON "discord_oauth_states"("expires_at");

-- CreateIndex
CREATE INDEX "idx_discord_role_sync_queue_pending" ON "discord_role_sync_queue"("status", "created_at");

-- AddForeignKey
ALTER TABLE "Demo" ADD CONSTRAINT "Demo_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoFile" ADD CONSTRAINT "DemoFile_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES "Demo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistStatsHistory" ADD CONSTRAINT "ArtistStatsHistory_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequestComment" ADD CONSTRAINT "ChangeRequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequestComment" ADD CONSTRAINT "ChangeRequestComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES "Demo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltySplit" ADD CONSTRAINT "RoyaltySplit_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltySplit" ADD CONSTRAINT "RoyaltySplit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltySplit" ADD CONSTRAINT "RoyaltySplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

