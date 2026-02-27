import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureDiscordBridgeTables } from "@/lib/discord-bridge-db";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";

const OAUTH_STATE_TTL_MINUTES = 15;

function normalizeRole(role) {
    if (!role) return "artist";
    const lowered = String(role).trim().toLowerCase();
    if (lowered === "admin" || lowered === "a&r" || lowered === "artist") return lowered;
    return "artist";
}

function extractSpotifyArtistId(url) {
    if (!url || typeof url !== "string") return null;
    const parts = url.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    const id = last.split("?")[0]?.trim();
    return id || null;
}

function safeJsonParse(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

export function createDiscordOauthStateToken() {
    return randomUUID().replace(/-/g, "");
}

export function getDiscordAvatarUrl(discordUserId, avatarHash) {
    if (!discordUserId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarHash}.png`;
}

export async function createDiscordOauthState({
    state,
    userId = null,
    discordUserId = null,
    discordUsername = null
}) {
    await ensureDiscordBridgeTables();

    const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MINUTES * 60_000);
    await prisma.$executeRaw`
        INSERT INTO discord_oauth_states (state, user_id, discord_user_id, discord_username, expires_at)
        VALUES (${state}, ${userId}, ${discordUserId}, ${discordUsername}, ${expiresAt})
    `;

    return {
        state,
        expiresAt
    };
}

export async function getDiscordOauthState(state) {
    await ensureDiscordBridgeTables();
    const rows = await prisma.$queryRaw`
        SELECT state, user_id, discord_user_id, discord_username, created_at, expires_at, consumed_at
        FROM discord_oauth_states
        WHERE state = ${state}
        LIMIT 1
    `;
    return rows?.[0] || null;
}

export async function attachUserToDiscordOauthState({ state, userId }) {
    await ensureDiscordBridgeTables();
    await prisma.$executeRaw`
        UPDATE discord_oauth_states
        SET user_id = ${userId}
        WHERE state = ${state}
          AND consumed_at IS NULL
    `;
}

export async function consumeDiscordOauthState(state) {
    await ensureDiscordBridgeTables();

    const rows = await prisma.$queryRaw`
        UPDATE discord_oauth_states
        SET consumed_at = NOW()
        WHERE state = ${state}
          AND consumed_at IS NULL
        RETURNING state, user_id, discord_user_id, discord_username, expires_at, created_at, consumed_at
    `;

    return rows?.[0] || null;
}

export async function getSiteUserByDiscordId(discordUserId) {
    if (!discordUserId) return null;
    await ensureDiscordBridgeTables();

    const rows = await prisma.$queryRaw`
        SELECT
            u.id,
            u.email,
            u."fullName" AS "fullName",
            u."stageName" AS "stageName",
            u.role,
            u.status,
            u."discordId" AS "discordId",
            l.discord_username,
            l.discord_avatar,
            l.guild_id
        FROM "User" u
        LEFT JOIN discord_account_links l ON l.user_id = u.id
        WHERE u."discordId" = ${discordUserId}
           OR l.discord_user_id = ${discordUserId}
        ORDER BY CASE WHEN u."discordId" = ${discordUserId} THEN 0 ELSE 1 END
        LIMIT 1
    `;

    return rows?.[0] || null;
}

export async function getDiscordLinkByUserId(userId) {
    if (!userId) return null;
    await ensureDiscordBridgeTables();

    const rows = await prisma.$queryRaw`
        SELECT
            l.user_id,
            l.discord_user_id,
            l.discord_username,
            l.discord_avatar,
            l.guild_id,
            l.linked_at,
            l.updated_at,
            u."discordId" AS "discordId"
        FROM discord_account_links l
        JOIN "User" u ON u.id = l.user_id
        WHERE l.user_id = ${userId}
        LIMIT 1
    `;

    return rows?.[0] || null;
}

export async function linkDiscordAccountToUser({
    userId,
    discordUserId,
    discordUsername,
    discordAvatar,
    guildId = null
}) {
    await ensureDiscordBridgeTables();

    const avatarUrl = getDiscordAvatarUrl(discordUserId, discordAvatar);

    return prisma.$transaction(async (tx) => {
        const existingRows = await tx.$queryRaw`
            SELECT id FROM "User"
            WHERE "discordId" = ${discordUserId}
              AND id <> ${userId}
            LIMIT 1
        `;

        if (existingRows?.length) {
            const err = new Error("DISCORD_ACCOUNT_ALREADY_LINKED");
            err.code = "DISCORD_ACCOUNT_ALREADY_LINKED";
            throw err;
        }

        const conflictingLinkRows = await tx.$queryRaw`
            SELECT user_id FROM discord_account_links
            WHERE discord_user_id = ${discordUserId}
              AND user_id <> ${userId}
            LIMIT 1
        `;

        if (conflictingLinkRows?.length) {
            const err = new Error("DISCORD_ACCOUNT_ALREADY_LINKED");
            err.code = "DISCORD_ACCOUNT_ALREADY_LINKED";
            throw err;
        }

        await tx.$executeRaw`
            UPDATE "User"
            SET "discordId" = ${discordUserId},
                "updatedAt" = NOW()
            WHERE id = ${userId}
        `;

        await tx.$executeRaw`
            INSERT INTO discord_account_links (
                user_id,
                discord_user_id,
                discord_username,
                discord_avatar,
                guild_id,
                linked_at,
                updated_at
            )
            VALUES (
                ${userId},
                ${discordUserId},
                ${discordUsername || null},
                ${avatarUrl || null},
                ${guildId || null},
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                discord_user_id = EXCLUDED.discord_user_id,
                discord_username = EXCLUDED.discord_username,
                discord_avatar = EXCLUDED.discord_avatar,
                guild_id = EXCLUDED.guild_id,
                updated_at = NOW()
        `;

        return {
            userId,
            discordUserId,
            discordUsername: discordUsername || null,
            discordAvatar: avatarUrl,
            guildId: guildId || null
        };
    });
}

export async function unlinkDiscordAccountFromUser(userId) {
    if (!userId) return;
    await ensureDiscordBridgeTables();

    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE "User"
            SET "discordId" = NULL,
                "updatedAt" = NOW()
            WHERE id = ${userId}
        `;

        await tx.$executeRaw`
            DELETE FROM discord_account_links
            WHERE user_id = ${userId}
        `;
    });
}

export async function insertDiscordOutboxEvent(eventType, payload, aggregateId = null) {
    await ensureDiscordBridgeTables();
    const bridgeConfig = await getDiscordBridgeConfig();

    if (!bridgeConfig.enabled || bridgeConfig.outboxEnabled === false) {
        return null;
    }

    const rows = await prisma.$queryRaw`
        INSERT INTO discord_event_outbox (event_type, aggregate_id, payload, status, attempts, next_attempt_at)
        VALUES (
            ${eventType},
            ${aggregateId || null},
            ${JSON.stringify(payload || {})}::jsonb,
            'pending',
            0,
            NOW()
        )
        RETURNING id, event_type, aggregate_id, payload, status, attempts, created_at
    `;

    return rows?.[0] || null;
}

export async function enqueueRoleSync({
    userId,
    discordUserId,
    role,
    guildId = null
}) {
    await ensureDiscordBridgeTables();
    if (!userId) return null;

    const bridgeConfig = await getDiscordBridgeConfig();
    const normalizedRole = normalizeRole(role);
    const targetDiscordRoleId = bridgeConfig?.roleMap?.[normalizedRole] || null;

    const existing = await prisma.$queryRaw`
        SELECT id, user_id, discord_user_id, target_role, target_discord_role_id, guild_id, status, created_at
        FROM discord_role_sync_queue
        WHERE user_id = ${userId}
          AND target_role = ${normalizedRole}
          AND status IN ('pending', 'processing')
        ORDER BY created_at DESC
        LIMIT 1
    `;
    if (existing?.[0]) {
        return existing[0];
    }

    const rows = await prisma.$queryRaw`
        INSERT INTO discord_role_sync_queue (
            user_id,
            discord_user_id,
            target_role,
            target_discord_role_id,
            guild_id,
            status,
            attempts,
            created_at,
            updated_at
        )
        VALUES (
            ${userId},
            ${discordUserId || null},
            ${normalizedRole},
            ${targetDiscordRoleId},
            ${guildId || bridgeConfig.defaultGuildId || null},
            'pending',
            0,
            NOW(),
            NOW()
        )
        RETURNING id, user_id, discord_user_id, target_role, target_discord_role_id, guild_id, status, created_at
    `;

    return rows?.[0] || null;
}

export async function enqueueArtistRoleSyncForRelease(release) {
    await ensureDiscordBridgeTables();
    if (!release) return { queued: 0, users: [] };

    let artists = [];
    try {
        artists = typeof release.artistsJson === "string"
            ? JSON.parse(release.artistsJson)
            : (Array.isArray(release.artistsJson) ? release.artistsJson : []);
    } catch {
        artists = [];
    }

    const artistIds = new Set(
        (artists || [])
            .map((item) => (typeof item === "object" ? item?.id : null))
            .filter(Boolean)
    );
    if (!artistIds.size) return { queued: 0, users: [] };

    const linkedRows = await prisma.$queryRaw`
        SELECT
            u.id AS user_id,
            u.role,
            u.status,
            u."spotifyUrl" AS user_spotify_url,
            a."spotifyUrl" AS artist_spotify_url,
            l.discord_user_id,
            l.guild_id
        FROM "User" u
        LEFT JOIN "Artist" a ON a."userId" = u.id
        JOIN discord_account_links l ON l.user_id = u.id
        WHERE u.role = 'artist'
    `;

    const matchedUsers = [];
    for (const row of linkedRows || []) {
        if (String(row?.status || "").toLowerCase() !== "approved") continue;
        const userSpotifyId = extractSpotifyArtistId(row?.user_spotify_url);
        const artistSpotifyId = extractSpotifyArtistId(row?.artist_spotify_url);
        if (!artistIds.has(userSpotifyId) && !artistIds.has(artistSpotifyId)) continue;
        matchedUsers.push(row);
    }

    let queued = 0;
    for (const user of matchedUsers) {
        const result = await enqueueRoleSync({
            userId: user.user_id,
            discordUserId: user.discord_user_id,
            role: "artist",
            guildId: user.guild_id || null
        });
        if (result?.id) queued += 1;
    }

    return {
        queued,
        users: matchedUsers.map((u) => u.user_id)
    };
}

export async function auditDiscordInternalRequest({
    requestId = null,
    endpoint,
    method,
    discordUserId = null,
    guildId = null,
    success = false,
    statusCode = null,
    signature = null
}) {
    await ensureDiscordBridgeTables();

    await prisma.$executeRaw`
        INSERT INTO discord_internal_audit (
            request_id,
            endpoint,
            method,
            discord_user_id,
            guild_id,
            success,
            status_code,
            signature,
            created_at
        )
        VALUES (
            ${requestId},
            ${endpoint},
            ${method},
            ${discordUserId},
            ${guildId},
            ${Boolean(success)},
            ${statusCode},
            ${signature},
            NOW()
        )
    `;
}

export async function isDiscordSignatureReplay(signature) {
    if (!signature) return false;
    await ensureDiscordBridgeTables();

    const rows = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM discord_internal_audit
        WHERE signature = ${signature}
          AND created_at > NOW() - INTERVAL '10 minutes'
          AND success = TRUE
    `;

    return Number(rows?.[0]?.count || 0) > 0;
}

export async function getDiscordBridgeAdminSnapshot() {
    await ensureDiscordBridgeTables();

    const safeQuery = async (queryFactory, fallback) => {
        try {
            return await queryFactory();
        } catch (error) {
            console.error("Discord bridge snapshot query failed:", error);
            return fallback;
        }
    };

    const [linkCountRows, pendingOutboxRows, pendingRoleRows, recentOutboxRows, recentRoleRows, recentAuditRows, linkedUsersRows] = await Promise.all([
        safeQuery(() => prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM discord_account_links`, []),
        safeQuery(() => prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM discord_event_outbox WHERE status IN ('pending', 'processing')`, []),
        safeQuery(() => prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM discord_role_sync_queue WHERE status IN ('pending', 'processing')`, []),
        safeQuery(() => prisma.$queryRaw`
            SELECT id, event_type, aggregate_id, payload, status, attempts, created_at, updated_at, last_error
            FROM discord_event_outbox
            ORDER BY created_at DESC
            LIMIT 20
        `, []),
        safeQuery(() => prisma.$queryRaw`
            SELECT id, user_id, discord_user_id, target_role, target_discord_role_id, guild_id, status, attempts, last_error, created_at, updated_at
            FROM discord_role_sync_queue
            ORDER BY created_at DESC
            LIMIT 20
        `, []),
        safeQuery(() => prisma.$queryRaw`
            SELECT id, request_id, endpoint, method, discord_user_id, guild_id, success, status_code, created_at
            FROM discord_internal_audit
            ORDER BY created_at DESC
            LIMIT 25
        `, []),
        safeQuery(() => prisma.$queryRaw`
            SELECT
                l.user_id,
                l.discord_user_id,
                l.discord_username,
                l.discord_avatar,
                l.guild_id,
                l.linked_at,
                u.email,
                u.role,
                u.status,
                u."stageName" AS "stageName"
            FROM discord_account_links l
            JOIN "User" u ON u.id = l.user_id
            ORDER BY l.linked_at DESC
            LIMIT 50
        `, [])
    ]);

    const roleSummaryRows = await safeQuery(() => prisma.$queryRaw`
        SELECT target_role, COUNT(*)::int AS count
        FROM discord_role_sync_queue
        GROUP BY target_role
        ORDER BY target_role ASC
    `, []);

    return {
        counters: {
            linkedAccounts: Number(linkCountRows?.[0]?.count || 0),
            pendingOutbox: Number(pendingOutboxRows?.[0]?.count || 0),
            pendingRoleSync: Number(pendingRoleRows?.[0]?.count || 0)
        },
        roleSummary: roleSummaryRows || [],
        recentOutbox: (recentOutboxRows || []).map((item) => ({
            ...item,
            payload: safeJsonParse(item.payload, {})
        })),
        recentRoleSync: recentRoleRows || [],
        recentAudit: recentAuditRows || [],
        linkedUsers: linkedUsersRows || []
    };
}
