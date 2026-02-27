import prisma from "@/lib/prisma";

let tablesEnsured = false;
let ensureTablesPromise = null;

const BRIDGE_SCHEMA_STATEMENTS = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discordId" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_discord_id_unique ON "User" ("discordId") WHERE "discordId" IS NOT NULL`,
    `CREATE TABLE IF NOT EXISTS discord_account_links (
        user_id TEXT PRIMARY KEY,
        discord_user_id TEXT UNIQUE NOT NULL,
        discord_username TEXT,
        discord_avatar TEXT,
        guild_id TEXT,
        linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE discord_account_links ADD COLUMN IF NOT EXISTS guild_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_discord_account_links_discord_user_id ON discord_account_links (discord_user_id)`,
    `CREATE TABLE IF NOT EXISTS discord_oauth_states (
        state TEXT PRIMARY KEY,
        user_id TEXT,
        discord_user_id TEXT,
        discord_username TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ
    )`,
    `ALTER TABLE discord_oauth_states ADD COLUMN IF NOT EXISTS user_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_discord_oauth_states_expires_at ON discord_oauth_states (expires_at)`,
    `CREATE TABLE IF NOT EXISTS discord_internal_audit (
        id BIGSERIAL PRIMARY KEY,
        request_id TEXT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        discord_user_id TEXT,
        guild_id TEXT,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        status_code INT,
        signature TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_discord_internal_audit_signature ON discord_internal_audit (signature)`,
    `CREATE INDEX IF NOT EXISTS idx_discord_internal_audit_created_at ON discord_internal_audit (created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_discord_internal_audit_request_id ON discord_internal_audit (request_id)`,
    `CREATE TABLE IF NOT EXISTS discord_event_outbox (
        id BIGSERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        aggregate_id TEXT,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_discord_event_outbox_pending ON discord_event_outbox (status, next_attempt_at, created_at)`,
    `CREATE TABLE IF NOT EXISTS discord_role_sync_queue (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        discord_user_id TEXT,
        target_role TEXT NOT NULL,
        target_discord_role_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT,
        guild_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE discord_role_sync_queue ADD COLUMN IF NOT EXISTS guild_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_discord_role_sync_queue_pending ON discord_role_sync_queue (status, created_at)`
];

export async function ensureDiscordBridgeTables() {
    if (tablesEnsured) return;
    if (!ensureTablesPromise) {
        ensureTablesPromise = (async () => {
            for (const statement of BRIDGE_SCHEMA_STATEMENTS) {
                await prisma.$executeRawUnsafe(statement);
            }
            tablesEnsured = true;
        })().catch((error) => {
            ensureTablesPromise = null;
            throw error;
        });
    }
    await ensureTablesPromise;
}

export async function cleanupExpiredDiscordOauthStates() {
    await ensureDiscordBridgeTables();
    await prisma.$executeRawUnsafe(`
        DELETE FROM discord_oauth_states
        WHERE expires_at < NOW() - INTERVAL '1 day'
    `);
}
