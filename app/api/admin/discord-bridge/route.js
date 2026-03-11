import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
    getDiscordBridgeConfig,
    DEFAULT_BRIDGE_CONFIG,
    sanitizeBridgeConfigForClient,
    saveDiscordBridgeConfig
} from "@/lib/discord-bridge-config";
import { normalizeDiscordBridgeInput } from "@/lib/discord-bridge-contract";
import { getDiscordBridgeSchemaStatus } from "@/lib/discord-bridge-db";
import { getDiscordBridgeAdminSnapshot } from "@/lib/discord-bridge-service";

function json(data, status = 200) {
    return new Response(
        JSON.stringify(data, (_, value) => (typeof value === "bigint" ? Number(value) : value)),
        { status, headers: { "Content-Type": "application/json" } }
    );
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
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
            config: sanitizeBridgeConfigForClient(config),
            schema: await getDiscordBridgeSchemaStatus().catch((error) => ({
                ready: false,
                error: error instanceof Error ? error.message : "Unknown error"
            })),
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
        const inputConfig = normalizeDiscordBridgeInput(payload?.config || payload || {});

        const saved = await saveDiscordBridgeConfig(inputConfig);

        return json({
            success: true,
            config: sanitizeBridgeConfigForClient(saved.discordBridge)
        }, 200);
    } catch (error) {
        console.error("Discord bridge PATCH failed:", error);
        return json({ error: error.message }, 500);
    }
}
