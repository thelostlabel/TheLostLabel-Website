import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";

export async function POST(req: NextRequest) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const requested = Number(auth.body?.batchSize || auth.body?.batch_size || 15);
        const batchSize = Number.isFinite(requested) ? Math.max(1, Math.min(50, requested)) : 15;

        const events = await prisma.$queryRaw`
            WITH picked AS (
                SELECT id
                FROM discord_event_outbox
                WHERE status = 'pending'
                  AND next_attempt_at <= NOW()
                ORDER BY created_at ASC
                LIMIT ${batchSize}
                FOR UPDATE SKIP LOCKED
            )
            UPDATE discord_event_outbox d
            SET
                status = 'processing',
                attempts = d.attempts + 1,
                updated_at = NOW()
            FROM picked
            WHERE d.id = picked.id
            RETURNING d.id, d.event_type, d.aggregate_id, d.payload, d.status, d.attempts, d.created_at, d.updated_at
        ` as Array<Record<string, unknown>>;

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            events: (events || []).map((event) => ({
                ...event,
                payload: (() => {
                    if (typeof event.payload !== "string") return event.payload;
                    try {
                        return JSON.parse(event.payload);
                    } catch {
                        return {};
                    }
                })()
            })),
            defaults: {
                guildId: auth.config.defaultGuildId || null,
                eventsChannelId: auth.config.eventsChannelId || null,
                supportChannelId: auth.config.supportChannelId || null
            }
        });
    } catch (error: unknown) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}
