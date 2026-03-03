import prisma from "@/lib/prisma";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";

/**
 * Notification type constants for Discord DM notifications.
 */
export const DISCORD_NOTIFY_TYPES = {
    DEMO_RECEIVED: "DEMO_RECEIVED",
    DEMO_APPROVED: "DEMO_APPROVED",
    DEMO_REJECTED: "DEMO_REJECTED",
    CONTRACT_CREATED: "CONTRACT_CREATED",
    DEMO_CONTRACT_SENT: "DEMO_CONTRACT_SENT",
    EARNINGS_UPDATE: "EARNINGS_UPDATE",
    SUPPORT_RESPONSE: "SUPPORT_RESPONSE",
    SUPPORT_STATUS: "SUPPORT_STATUS",
    PAYOUT_UPDATE: "PAYOUT_UPDATE",
    BROADCAST: "BROADCAST",
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

        // Insert into discord_event_outbox — payload matches NotificationService.handle_notification()
        const event = await insertDiscordOutboxEvent(
            "dm_notification",
            {
                discordId: user.discordId,
                type,      // e.g. "DEMO_APPROVED" — matched by create_notification_embed()
                data       // passed directly to embed builder
            },
            userId
        );

        return event;
    } catch (error) {
        console.error(`[Discord Notifications] Failed to queue DM notification for user ${userId}:`, error);
        return null;
    }
}

