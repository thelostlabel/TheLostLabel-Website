import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureDiscordBridgeTables } from "@/lib/discord-bridge-db";
import {
    DEFAULT_BRIDGE_CONFIG,
    getDiscordBridgeConfig,
    saveDiscordBridgeConfig
} from "@/lib/discord-bridge-config";
import { getDiscordBridgeAdminSnapshot } from "@/lib/discord-bridge-service";

function json(data, status = 200) {
    return new Response(
        JSON.stringify(data, (_, value) => (typeof value === "bigint" ? Number(value) : value)),
        { status, headers: { "Content-Type": "application/json" } }
    );
}

function mergeWithDefaults(input = {}) {
    return {
        ...DEFAULT_BRIDGE_CONFIG,
        ...input,
        roleMap: {
            ...DEFAULT_BRIDGE_CONFIG.roleMap,
            ...(input?.roleMap || {})
        }
    };
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
        await ensureDiscordBridgeTables();

        let config = DEFAULT_BRIDGE_CONFIG;
        let snapshot = {
            counters: { linkedAccounts: 0, pendingOutbox: 0, pendingRoleSync: 0 },
            roleSummary: [],
            recentOutbox: [],
            recentRoleSync: [],
            recentAudit: [],
            linkedUsers: []
        };

        try {
            config = await getDiscordBridgeConfig();
        } catch (error) {
            console.error("Discord bridge config load failed:", error);
        }

        try {
            snapshot = await getDiscordBridgeAdminSnapshot();
        } catch (error) {
            console.error("Discord bridge snapshot load failed:", error);
        }

        return json({
            config,
            snapshot
        }, 200);
    } catch (error) {
        console.error("Discord bridge GET failed:", error);
        return json({ error: error.message }, 500);
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
        const payload = await req.json();
        const inputConfig = payload?.config || payload || {};

        const normalized = mergeWithDefaults({
            enabled: Boolean(inputConfig.enabled),
            outboxEnabled: inputConfig.outboxEnabled !== false,
            publicBaseUrl: String(inputConfig.publicBaseUrl || "").trim(),
            oauthClientId: String(inputConfig.oauthClientId || "").trim(),
            oauthClientSecret: String(inputConfig.oauthClientSecret || "").trim(),
            oauthRedirectUri: String(inputConfig.oauthRedirectUri || "").trim(),
            internalToken: String(inputConfig.internalToken || "").trim(),
            internalSigningSecret: String(inputConfig.internalSigningSecret || "").trim(),
            defaultGuildId: String(inputConfig.defaultGuildId || "").trim(),
            supportChannelId: String(inputConfig.supportChannelId || "").trim(),
            eventsChannelId: String(inputConfig.eventsChannelId || "").trim(),
            roleMap: {
                admin: String(inputConfig?.roleMap?.admin || "").trim(),
                "a&r": String(inputConfig?.roleMap?.["a&r"] || "").trim(),
                artist: String(inputConfig?.roleMap?.artist || "").trim()
            },
            botRuntime: {
                personality: String(inputConfig?.botRuntime?.personality || "helpful").trim().toLowerCase(),
                visionAi: Boolean(inputConfig?.botRuntime?.visionAi),
                smartHelper: inputConfig?.botRuntime?.smartHelper !== false,
                smartHelperMode: String(inputConfig?.botRuntime?.smartHelperMode || "questions_only").trim().toLowerCase(),
                smartHelperKeywords: Array.isArray(inputConfig?.botRuntime?.smartHelperKeywords)
                    ? inputConfig.botRuntime.smartHelperKeywords
                    : [],
                smartHelperBlockedKeywords: Array.isArray(inputConfig?.botRuntime?.smartHelperBlockedKeywords)
                    ? inputConfig.botRuntime.smartHelperBlockedKeywords
                    : [],
                smartHelperRequireQuestion: inputConfig?.botRuntime?.smartHelperRequireQuestion !== false,
                agentMode: Boolean(inputConfig?.botRuntime?.agentMode)
            }
        });

        const saved = await saveDiscordBridgeConfig(normalized);

        return json({
            success: true,
            config: saved.discordBridge
        }, 200);
    } catch (error) {
        console.error("Discord bridge PATCH failed:", error);
        return json({ error: error.message }, 500);
    }
}
