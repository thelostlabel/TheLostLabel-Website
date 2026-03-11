import prisma from "@/lib/prisma";
import { fetchWithRetry, fetchWithTimeout, isTransientStatus } from "@/lib/fetch-utils";

export const DISCORD_WEBHOOK_TIMEOUT_MS = 10000;
export const DISCORD_WEBHOOK_RETRY_OPTIONS = {
    retries: 2,
    baseDelayMs: 300,
    maxDelayMs: 2500,
    jitter: 0.2
};

export function isValidDiscordWebhookUrl(value) {
    try {
        const parsed = new URL(String(value || "").trim());
        return parsed.protocol === "https:" &&
            parsed.hostname === "discord.com" &&
            /^\/api\/webhooks\/[^/]+\/[^/]+$/.test(parsed.pathname);
    } catch {
        return false;
    }
}

export function createDiscordTransientWebhookError(status, context = "Discord webhook") {
    const error = new Error(`${context} transient status: ${status}`);
    error.isTransient = true;
    error.status = status;
    return error;
}

export function buildDiscordWebhookPayload({ embeds = [], username = "LOST Music Bot", avatarUrl = "https://i.imgur.com/AfFp7pu.png" } = {}) {
    return {
        username,
        avatar_url: avatarUrl,
        embeds
    };
}

export async function sendDiscordWebhook(webhook, payload, { timeoutMs = DISCORD_WEBHOOK_TIMEOUT_MS, retryOptions = DISCORD_WEBHOOK_RETRY_OPTIONS, context } = {}) {
    return fetchWithRetry(async () => {
        const response = await fetchWithTimeout(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, timeoutMs);

        if (isTransientStatus(response.status)) {
            throw createDiscordTransientWebhookError(response.status, context || webhook.name || "Discord webhook");
        }

        return response;
    }, retryOptions);
}

export async function findDiscordWebhookById(id) {
    return prisma.webhook.findUnique({
        where: { id },
        select: { id: true, name: true, url: true, events: true, enabled: true, config: true }
    });
}

export async function listEnabledDiscordWebhooks() {
    return prisma.webhook.findMany({
        where: { enabled: true },
        orderBy: { createdAt: "desc" }
    });
}
