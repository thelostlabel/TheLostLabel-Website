import prisma from "@/lib/prisma";
import {
    DEFAULT_BRIDGE_CONFIG as DEFAULT_BRIDGE_CONTRACT,
    createDiscordBridgeClientConfig,
    mergeDiscordBridgeConfig,
    safeParseJson,
    sanitizeSystemDiscordBridgeConfig,
    stripSecretFields
} from "@/lib/discord-bridge-contract";

function buildRuntimeDefaults() {
    const nextAuthUrl = String(process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
    return mergeDiscordBridgeConfig(DEFAULT_BRIDGE_CONTRACT, {
        publicBaseUrl: nextAuthUrl,
        oauthClientId: process.env.DISCORD_CLIENT_ID || "",
        oauthClientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        oauthRedirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI || `${nextAuthUrl}/api/discord/oauth/callback`,
        internalToken: process.env.BOT_INTERNAL_TOKEN || "",
        internalSigningSecret: process.env.BOT_INTERNAL_SIGNING_SECRET || "",
        defaultGuildId: process.env.DISCORD_GUILD_ID || ""
    });
}

export const DEFAULT_BRIDGE_CONFIG = buildRuntimeDefaults();

function withRuntimeSecrets(config = {}) {
    return {
        ...config,
        oauthClientSecret: process.env.DISCORD_CLIENT_SECRET || config.oauthClientSecret || "",
        internalToken: process.env.BOT_INTERNAL_TOKEN || config.internalToken || "",
        internalSigningSecret: process.env.BOT_INTERNAL_SIGNING_SECRET || config.internalSigningSecret || ""
    };
}

export function sanitizeBridgeConfigForClient(config = {}) {
    return createDiscordBridgeClientConfig(config);
}

export async function getSystemConfigObject() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
        select: { config: true }
    });

    const parsed = safeParseJson(settings?.config, {});
    const { sanitized, changed } = sanitizeSystemDiscordBridgeConfig(parsed);

    if (changed) {
        await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(sanitized) },
            create: { id: "default", config: JSON.stringify(sanitized) }
        });
    }

    return sanitized;
}

export async function getDiscordBridgeConfig() {
    const systemConfig = await getSystemConfigObject();
    return withRuntimeSecrets(
        mergeDiscordBridgeConfig(DEFAULT_BRIDGE_CONFIG, systemConfig?.discordBridge || {})
    );
}

export async function saveDiscordBridgeConfig(nextBridgeConfig) {
    const systemConfig = await getSystemConfigObject();
    const mergedBridge = withRuntimeSecrets(
        mergeDiscordBridgeConfig(DEFAULT_BRIDGE_CONFIG, nextBridgeConfig || {})
    );
    const nextConfig = {
        ...systemConfig,
        discordBridge: stripSecretFields(mergedBridge)
    };

    const row = await prisma.systemSettings.upsert({
        where: { id: "default" },
        update: { config: JSON.stringify(nextConfig) },
        create: { id: "default", config: JSON.stringify(nextConfig) }
    });

    return {
        config: nextConfig,
        raw: row.config,
        discordBridge: mergedBridge
    };
}
