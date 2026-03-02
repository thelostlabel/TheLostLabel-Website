import prisma from "@/lib/prisma";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";

/**
 * Notification type constants for Discord DM notifications.
 */
export const DISCORD_NOTIFY_TYPES = {
    DEMO_APPROVED: "demo_approved_dm",
    DEMO_REJECTED: "demo_rejected_dm",
    DEMO_CONTRACT_SENT: "demo_contract_sent_dm",
    EARNINGS_UPDATE: "earnings_update_dm",
    SUPPORT_RESPONSE: "support_response_dm"
};

/**
 * Queue a Discord DM notification for a user.
 * Checks if the user has a linked Discord account and has opted in to DM notifications.
 * If so, inserts a 'dm_notification' event into the discord_event_outbox table.
 *
 * @param {string} userId - The website user ID
 * @param {string} type - Notification type (from DISCORD_NOTIFY_TYPES)
 * @param {object} data - Notification data payload (title, description, color, fields)
 * @returns {object|null} The created outbox event, or null if user is not eligible
 */
export async function queueDiscordNotification(userId, type, data) {
    if (!userId || !type) return null;

    try {
        // Check if user has discordId and discordNotifyEnabled
        // discordId may be in the Prisma model or only in the raw column,
        // so we use raw SQL to be safe (it was originally added via ALTER TABLE)
        const users = await prisma.$queryRaw`
            SELECT "discordId", "discordNotifyEnabled"
            FROM "User"
            WHERE id = ${userId}
            LIMIT 1
        `;

        const user = users?.[0];
        if (!user?.discordId || !user?.discordNotifyEnabled) {
            return null;
        }

        // Insert into discord_event_outbox with eventType 'dm_notification'
        const event = await insertDiscordOutboxEvent(
            "dm_notification",
            {
                discordId: user.discordId,
                type,
                data: {
                    title: data.title || "Notification",
                    description: data.description || null,
                    color: data.color || 0x7c3aed, // Default purple
                    fields: data.fields || [],
                    ...(data.footer ? { footer: data.footer } : {})
                }
            },
            userId
        );

        return event;
    } catch (error) {
        console.error(`[Discord Notifications] Failed to queue DM notification for user ${userId}:`, error);
        return null;
    }
}
