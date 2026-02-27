-- Wave 1 (Quick Wins + Security): index package for hot query paths.
-- Run against PostgreSQL with a role that can create indexes concurrently.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_status_created_at
  ON "Demo" ("status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_artist_id_created_at
  ON "Demo" ("artistId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_user_id_created_at
  ON "Payment" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_status_created_at
  ON "Payment" ("status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_request_status_created_at
  ON "ChangeRequest" ("status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_request_user_id_created_at
  ON "ChangeRequest" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_request_assigned_to_created_at
  ON "ChangeRequest" ("assignedToId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_earning_contract_id_period
  ON "Earning" ("contractId", "period" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_earning_created_at
  ON "Earning" ("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_user_id_created_at
  ON "Contract" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_artist_id_created_at
  ON "Contract" ("artistId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_release_id
  ON "Contract" ("releaseId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_status_created_at
  ON "Contract" ("status", "createdAt" DESC);
