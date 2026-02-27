import prisma from "@/lib/prisma";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const requested = Number(auth.body?.batchSize || auth.body?.batch_size || 20);
        const batchSize = Number.isFinite(requested) ? Math.max(1, Math.min(60, requested)) : 20;

        const jobs = await prisma.$queryRaw`
            WITH picked AS (
                SELECT id
                FROM discord_role_sync_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT ${batchSize}
                FOR UPDATE SKIP LOCKED
            )
            UPDATE discord_role_sync_queue q
            SET
                status = 'processing',
                attempts = q.attempts + 1,
                updated_at = NOW()
            FROM picked
            WHERE q.id = picked.id
            RETURNING q.id, q.user_id, q.discord_user_id, q.target_role, q.target_discord_role_id, q.guild_id, q.status, q.attempts, q.created_at, q.updated_at
        `;

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            jobs,
            defaults: {
                guildId: auth.config.defaultGuildId || null,
                roleMap: auth.config.roleMap || {}
            }
        });
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to pull role sync jobs." }, 500);
    }
}
