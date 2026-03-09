import prisma from "@/lib/prisma";

const SECRET_KEYS = ["oauthClientSecret", "internalToken", "internalSigningSecret"];

const DEFAULT_BRIDGE_CONFIG = {
    enabled: false,
    publicBaseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    oauthClientId: process.env.DISCORD_CLIENT_ID || "",
    oauthClientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    oauthRedirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/discord/oauth/callback`,
    internalToken: process.env.BOT_INTERNAL_TOKEN || "",
    internalSigningSecret: process.env.BOT_INTERNAL_SIGNING_SECRET || "",
    defaultGuildId: process.env.DISCORD_GUILD_ID || "",
    roleMap: {
        admin: "",
        "a&r": "",
        artist: ""
    },
    outboxEnabled: true,
    supportChannelId: "",
    eventsChannelId: "",
    botRuntime: {
        personality: "helpful",
        visionAi: false,
        smartHelper: true,
        smartHelperMode: "questions_only",
        smartHelperKeywords: [
            "nasil yaparim",
            "hata aliyorum",
            "yardim",
            "help",
            "how to",
            "not working"
        ],
        smartHelperBlockedKeywords: [],
        smartHelperRequireQuestion: true,
        agentMode: false
    }
};

function safeParseJson(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function stripSecretFields(input = {}) {
    const next = { ...(input || {}) };
    for (const key of SECRET_KEYS) {
        delete next[key];
    }
    return next;
}

function sanitizeSystemConfig(config = {}) {
    const next = { ...(config || {}) };
    const originalBridge = next.discordBridge;
    if (!originalBridge || typeof originalBridge !== "object") {
        return { sanitized: next, changed: false };
    }

    const sanitizedBridge = stripSecretFields(originalBridge);
    const changed = SECRET_KEYS.some((key) => Object.prototype.hasOwnProperty.call(originalBridge, key));

    next.discordBridge = sanitizedBridge;
    return { sanitized: next, changed };
}

function withRuntimeSecrets(config = {}) {
    return {
        ...config,
        oauthClientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        internalToken: process.env.BOT_INTERNAL_TOKEN || "",
        internalSigningSecret: process.env.BOT_INTERNAL_SIGNING_SECRET || ""
    };
}

function mergeBridgeConfig(input = {}) {
    const sanitizedInput = stripSecretFields(input);
    const pick = (key) => {
        const incoming = sanitizedInput?.[key];
        if (incoming === undefined || incoming === null || incoming === "") {
            return DEFAULT_BRIDGE_CONFIG[key];
        }
        return incoming;
    };

    return withRuntimeSecrets({
        ...DEFAULT_BRIDGE_CONFIG,
        ...sanitizedInput,
        enabled: sanitizedInput?.enabled === undefined ? DEFAULT_BRIDGE_CONFIG.enabled : Boolean(sanitizedInput.enabled),
        outboxEnabled: sanitizedInput?.outboxEnabled === undefined ? DEFAULT_BRIDGE_CONFIG.outboxEnabled : Boolean(sanitizedInput.outboxEnabled),
        publicBaseUrl: (process.env.NEXTAUTH_URL || pick("publicBaseUrl")).replace(/\/+$/, ""),
        oauthClientId: pick("oauthClientId"),
        oauthRedirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI ||
            `${process.env.NEXTAUTH_URL?.replace(/\/+$/, "") || "http://localhost:3000"}/api/discord/oauth/callback`,
        defaultGuildId: pick("defaultGuildId"),
        supportChannelId: pick("supportChannelId"),
        eventsChannelId: pick("eventsChannelId"),
        roleMap: {
            ...DEFAULT_BRIDGE_CONFIG.roleMap,
            ...(sanitizedInput?.roleMap || {})
        },
        botRuntime: {
            ...DEFAULT_BRIDGE_CONFIG.botRuntime,
            ...(sanitizedInput?.botRuntime || {}),
            personality: String(sanitizedInput?.botRuntime?.personality || DEFAULT_BRIDGE_CONFIG.botRuntime.personality).toLowerCase(),
            visionAi: sanitizedInput?.botRuntime?.visionAi === undefined ? DEFAULT_BRIDGE_CONFIG.botRuntime.visionAi : Boolean(sanitizedInput.botRuntime.visionAi),
            smartHelper: sanitizedInput?.botRuntime?.smartHelper === undefined ? DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelper : Boolean(sanitizedInput.botRuntime.smartHelper),
            smartHelperMode: String(sanitizedInput?.botRuntime?.smartHelperMode || DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperMode).toLowerCase(),
            smartHelperKeywords: Array.isArray(sanitizedInput?.botRuntime?.smartHelperKeywords)
                ? sanitizedInput.botRuntime.smartHelperKeywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
                : DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperKeywords,
            smartHelperBlockedKeywords: Array.isArray(sanitizedInput?.botRuntime?.smartHelperBlockedKeywords)
                ? sanitizedInput.botRuntime.smartHelperBlockedKeywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
                : DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperBlockedKeywords,
            smartHelperRequireQuestion: sanitizedInput?.botRuntime?.smartHelperRequireQuestion === undefined
                ? DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperRequireQuestion
                : Boolean(sanitizedInput.botRuntime.smartHelperRequireQuestion),
            agentMode: sanitizedInput?.botRuntime?.agentMode === undefined
                ? DEFAULT_BRIDGE_CONFIG.botRuntime.agentMode
                : Boolean(sanitizedInput.botRuntime.agentMode)
        }
    });
}

function secretStatus(config = {}) {
    return {
        oauthClientSecretConfigured: Boolean(config.oauthClientSecret),
        internalTokenConfigured: Boolean(config.internalToken),
        internalSigningSecretConfigured: Boolean(config.internalSigningSecret)
    };
}

export function sanitizeBridgeConfigForClient(config = {}) {
    return {
        ...stripSecretFields(config),
        ...secretStatus(config)
    };
}

export async function getSystemConfigObject() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
        select: { config: true }
    });

    const parsed = safeParseJson(settings?.config, {});
    const { sanitized, changed } = sanitizeSystemConfig(parsed);

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
    return mergeBridgeConfig(systemConfig?.discordBridge || {});
}

export async function saveDiscordBridgeConfig(nextBridgeConfig) {
    const systemConfig = await getSystemConfigObject();
    const mergedBridge = mergeBridgeConfig(nextBridgeConfig || {});
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

export { DEFAULT_BRIDGE_CONFIG };
