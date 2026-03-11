import prisma from "@/lib/prisma";

import { safeParseJson } from "@/lib/discord-bridge-contract";

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
            payload: safeParseJson(item.payload, {})
        })),
        recentRoleSync: recentRoleRows || [],
        recentAudit: recentAuditRows || [],
        linkedUsers: linkedUsersRows || []
    };
}
