const SECRET_KEYS = ["oauthClientSecret", "internalToken", "internalSigningSecret"];
const DEFAULT_ROLE_MAP = {
    admin: "",
    "a&r": "",
    artist: ""
};

export const DEFAULT_BOT_RUNTIME_CONFIG = {
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
};

export const DEFAULT_BRIDGE_CONFIG = {
    enabled: false,
    publicBaseUrl: "http://localhost:3000",
    oauthClientId: "",
    oauthClientSecret: "",
    oauthRedirectUri: "",
    internalToken: "",
    internalSigningSecret: "",
    defaultGuildId: "",
    roleMap: DEFAULT_ROLE_MAP,
    outboxEnabled: true,
    supportChannelId: "",
    eventsChannelId: "",
    botRuntime: DEFAULT_BOT_RUNTIME_CONFIG
};

export function safeParseJson(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

export function stripSecretFields(input = {}) {
    const next = { ...(input || {}) };
    for (const key of SECRET_KEYS) {
        delete next[key];
    }
    return next;
}

export function normalizeKeywordList(value, fallback = DEFAULT_BOT_RUNTIME_CONFIG.smartHelperKeywords) {
    const source = Array.isArray(value) ? value : fallback;
    return source
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 40);
}

export function csvToKeywordList(value) {
    return normalizeKeywordList(String(value || "").split(","));
}

export function keywordListToCsv(value) {
    return Array.isArray(value) ? value.filter(Boolean).join(", ") : "";
}

export function normalizeDiscordBridgeRuntime(input = {}) {
    return {
        ...DEFAULT_BOT_RUNTIME_CONFIG,
        ...(input || {}),
        personality: String(input?.personality || DEFAULT_BOT_RUNTIME_CONFIG.personality).trim().toLowerCase(),
        visionAi: input?.visionAi === undefined ? DEFAULT_BOT_RUNTIME_CONFIG.visionAi : Boolean(input.visionAi),
        smartHelper: input?.smartHelper === undefined ? DEFAULT_BOT_RUNTIME_CONFIG.smartHelper : Boolean(input.smartHelper),
        smartHelperMode: String(input?.smartHelperMode || DEFAULT_BOT_RUNTIME_CONFIG.smartHelperMode).trim().toLowerCase(),
        smartHelperKeywords: normalizeKeywordList(input?.smartHelperKeywords, DEFAULT_BOT_RUNTIME_CONFIG.smartHelperKeywords),
        smartHelperBlockedKeywords: normalizeKeywordList(input?.smartHelperBlockedKeywords, []),
        smartHelperRequireQuestion: input?.smartHelperRequireQuestion === undefined
            ? DEFAULT_BOT_RUNTIME_CONFIG.smartHelperRequireQuestion
            : Boolean(input.smartHelperRequireQuestion),
        agentMode: input?.agentMode === undefined ? DEFAULT_BOT_RUNTIME_CONFIG.agentMode : Boolean(input.agentMode)
    };
}

export function normalizeDiscordBridgeInput(input = {}) {
    return {
        enabled: Boolean(input?.enabled),
        outboxEnabled: input?.outboxEnabled === undefined ? DEFAULT_BRIDGE_CONFIG.outboxEnabled : Boolean(input.outboxEnabled),
        publicBaseUrl: String(input?.publicBaseUrl || "").trim(),
        oauthClientId: String(input?.oauthClientId || "").trim(),
        oauthClientSecret: String(input?.oauthClientSecret || "").trim(),
        oauthRedirectUri: String(input?.oauthRedirectUri || "").trim(),
        internalToken: String(input?.internalToken || "").trim(),
        internalSigningSecret: String(input?.internalSigningSecret || "").trim(),
        defaultGuildId: String(input?.defaultGuildId || "").trim(),
        supportChannelId: String(input?.supportChannelId || "").trim(),
        eventsChannelId: String(input?.eventsChannelId || "").trim(),
        roleMap: {
            ...DEFAULT_ROLE_MAP,
            admin: String(input?.roleMap?.admin || "").trim(),
            "a&r": String(input?.roleMap?.["a&r"] || "").trim(),
            artist: String(input?.roleMap?.artist || "").trim()
        },
        botRuntime: normalizeDiscordBridgeRuntime(input?.botRuntime || {})
    };
}

export function mergeDiscordBridgeConfig(baseConfig = DEFAULT_BRIDGE_CONFIG, input = {}) {
    const normalizedInput = normalizeDiscordBridgeInput(input);
    const base = {
        ...DEFAULT_BRIDGE_CONFIG,
        ...(baseConfig || {}),
        roleMap: {
            ...DEFAULT_ROLE_MAP,
            ...(baseConfig?.roleMap || {})
        },
        botRuntime: normalizeDiscordBridgeRuntime(baseConfig?.botRuntime || {})
    };

    const pick = (key) => {
        const incoming = normalizedInput[key];
        if (incoming === undefined || incoming === null || incoming === "") {
            return base[key];
        }
        return incoming;
    };

    return {
        ...base,
        ...normalizedInput,
        enabled: normalizedInput.enabled,
        outboxEnabled: normalizedInput.outboxEnabled,
        publicBaseUrl: pick("publicBaseUrl"),
        oauthClientId: pick("oauthClientId"),
        oauthRedirectUri: pick("oauthRedirectUri"),
        defaultGuildId: pick("defaultGuildId"),
        supportChannelId: pick("supportChannelId"),
        eventsChannelId: pick("eventsChannelId"),
        roleMap: {
            ...DEFAULT_ROLE_MAP,
            ...(base.roleMap || {}),
            ...(normalizedInput.roleMap || {})
        },
        botRuntime: normalizeDiscordBridgeRuntime({
            ...(base.botRuntime || {}),
            ...(normalizedInput.botRuntime || {})
        })
    };
}

export function getDiscordBridgeSecretStatus(config = {}) {
    return {
        oauthClientSecretConfigured: Boolean(config.oauthClientSecret),
        internalTokenConfigured: Boolean(config.internalToken),
        internalSigningSecretConfigured: Boolean(config.internalSigningSecret)
    };
}

export function createDiscordBridgeClientConfig(config = {}) {
    const merged = mergeDiscordBridgeConfig(DEFAULT_BRIDGE_CONFIG, config);
    return {
        ...stripSecretFields(merged),
        ...getDiscordBridgeSecretStatus(config),
        roleMap: {
            ...DEFAULT_ROLE_MAP,
            ...(merged.roleMap || {})
        },
        botRuntime: normalizeDiscordBridgeRuntime(merged.botRuntime || {})
    };
}

export function sanitizeSystemDiscordBridgeConfig(config = {}) {
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
