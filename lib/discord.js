/**
 * Discord Webhook Utility
 * Sends formatted notifications to the configured Discord channel.
 */
import prisma from "@/lib/prisma";
import { buildDiscordWebhookPayload, sendDiscordWebhook } from "@/lib/discord-webhooks";

// Helper to check if a webhook subscribes to an event
const hasEvent = (webhookEvents, targetEvent) => {
    if (!webhookEvents) return false;
    const events = webhookEvents.split(',').map((e) => e.trim());
    return events.includes(targetEvent);
};

const postWebhookWithRetry = async (webhook, payload) => {
    return sendDiscordWebhook(webhook, payload, { context: webhook.name || "Discord notification" }).then((response) => {
        if (!response.ok) {
            console.error(`[Discord] Failed to send to ${webhook.name}: ${response.status}`);
        }

        return response;
    }).catch((error) => {
        console.error(`[Discord] Error sending to ${webhook.name}:`, error);
    });
};

export async function sendDiscordNotification(options) {
    const {
        title = "LOST Notification",
        description = "",
        color = 0x00ff00,
        fields = [],
        thumbnail = null,
        footer = "LOST Music Group",
        event = null
    } = options;

    try {
        const webhooks = await prisma.webhook.findMany({
            where: { enabled: true }
        });

        const targets = webhooks.filter((w) => !event || hasEvent(w.events, event));

        if (targets.length === 0) {
            console.log(`[Discord] No webhooks found for event: ${event}`);
            return false;
        }

        const embed = {
            title,
            description,
            color,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: footer }
        };

        if (thumbnail) {
            embed.thumbnail = { url: thumbnail };
        }

        const payload = buildDiscordWebhookPayload({ embeds: [embed] });

        await Promise.all(targets.map((webhook) => postWebhookWithRetry(webhook, payload)));
        return true;
    } catch (error) {
        console.error('[Discord] Error in notification system:', error);
        return false;
    }
}

export async function notifyNewTrack(trackName, artistName, albumArt = null) {
    return sendDiscordNotification({
        title: "🎵 NEW TRACK ADDED",
        description: `**${trackName}** by **${artistName}** has been added to the label playlist.`,
        color: 0x1DB954,
        thumbnail: albumArt,
        event: 'new_track',
        fields: [
            { name: "Track", value: trackName, inline: true },
            { name: "Artist", value: artistName, inline: true }
        ]
    });
}

export async function notifyDemoSubmission(artistName, trackTitle, genre, trackLink) {
    return sendDiscordNotification({
        title: "🎵 New Demo Submission",
        color: 0x00ff88,
        event: 'demo_submit',
        fields: [
            { name: "Artist", value: artistName, inline: true },
            { name: "Track", value: trackTitle, inline: true },
            { name: "Genre", value: genre || "Not Specified", inline: true },
            { name: "Link", value: trackLink ? `[Listen Here](${trackLink})` : "Files Uploaded", inline: false }
        ]
    });
}

export async function notifyDemoApproval(artistName, trackTitle, releaseDate) {
    return sendDiscordNotification({
        title: "✅ DEMO APPROVED",
        description: `**${trackTitle}** by **${artistName}** has been approved for release!`,
        color: 0x00ff88,
        event: 'demo_approve',
        fields: [
            { name: "Artist", value: artistName, inline: true },
            { name: "Track", value: trackTitle, inline: true },
            { name: "Release Date", value: new Date(releaseDate).toLocaleDateString(), inline: true }
        ]
    });
}
