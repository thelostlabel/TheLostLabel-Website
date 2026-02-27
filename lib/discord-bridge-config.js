import prisma from "@/lib/prisma";

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

function mergeBridgeConfig(input = {}) {
    const pick = (key) => {
        const incoming = input?.[key];
        if (incoming === undefined || incoming === null || incoming === "") {
            return DEFAULT_BRIDGE_CONFIG[key];
        }
        return incoming;
    };

    return {
        ...DEFAULT_BRIDGE_CONFIG,
        ...input,
        enabled: input?.enabled === undefined ? DEFAULT_BRIDGE_CONFIG.enabled : Boolean(input.enabled),
        outboxEnabled: input?.outboxEnabled === undefined ? DEFAULT_BRIDGE_CONFIG.outboxEnabled : Boolean(input.outboxEnabled),
        publicBaseUrl: pick("publicBaseUrl"),
        oauthClientId: pick("oauthClientId"),
        oauthClientSecret: pick("oauthClientSecret"),
        oauthRedirectUri: pick("oauthRedirectUri"),
        internalToken: pick("internalToken"),
        internalSigningSecret: pick("internalSigningSecret"),
        defaultGuildId: pick("defaultGuildId"),
        supportChannelId: pick("supportChannelId"),
        eventsChannelId: pick("eventsChannelId"),
        roleMap: {
            ...DEFAULT_BRIDGE_CONFIG.roleMap,
            ...(input?.roleMap || {})
        },
        botRuntime: {
            ...DEFAULT_BRIDGE_CONFIG.botRuntime,
            ...(input?.botRuntime || {}),
            personality: String(input?.botRuntime?.personality || DEFAULT_BRIDGE_CONFIG.botRuntime.personality).toLowerCase(),
            visionAi: input?.botRuntime?.visionAi === undefined ? DEFAULT_BRIDGE_CONFIG.botRuntime.visionAi : Boolean(input.botRuntime.visionAi),
            smartHelper: input?.botRuntime?.smartHelper === undefined ? DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelper : Boolean(input.botRuntime.smartHelper),
            smartHelperMode: String(input?.botRuntime?.smartHelperMode || DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperMode).toLowerCase(),
            smartHelperKeywords: Array.isArray(input?.botRuntime?.smartHelperKeywords)
                ? input.botRuntime.smartHelperKeywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
                : DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperKeywords,
            smartHelperBlockedKeywords: Array.isArray(input?.botRuntime?.smartHelperBlockedKeywords)
                ? input.botRuntime.smartHelperBlockedKeywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
                : DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperBlockedKeywords,
            smartHelperRequireQuestion: input?.botRuntime?.smartHelperRequireQuestion === undefined
                ? DEFAULT_BRIDGE_CONFIG.botRuntime.smartHelperRequireQuestion
                : Boolean(input.botRuntime.smartHelperRequireQuestion),
            agentMode: input?.botRuntime?.agentMode === undefined
                ? DEFAULT_BRIDGE_CONFIG.botRuntime.agentMode
                : Boolean(input.botRuntime.agentMode)
        }
    };
}

export async function getSystemConfigObject() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
        select: { config: true }
    });
    return safeParseJson(settings?.config, {});
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
        discordBridge: mergedBridge
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
