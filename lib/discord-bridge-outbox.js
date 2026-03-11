import prisma from "@/lib/prisma";

import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";

export async function insertDiscordOutboxEvent(eventType, payload, aggregateId = null) {
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
