import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";
import {
    createDiscordOauthState,
    createDiscordOauthStateToken,
    getDiscordLinkByUserId,
    unlinkDiscordAccountFromUser
} from "@/lib/discord-bridge-service";

function json(payload: Record<string, unknown>, status: number = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

function normalizeBaseUrl(value: string | undefined | null): string {
    const fallback = "http://localhost:3000";
    const selected = String(value || fallback).trim() || fallback;
    return selected.replace(/\/+$/, "");
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
        const link = await getDiscordLinkByUserId(session.user.id);
        return json({
            linked: Boolean(link?.discord_user_id),
            discordUserId: link?.discord_user_id || null,
            discordUsername: link?.discord_username || null,
            discordAvatar: link?.discord_avatar || null,
            guildId: link?.guild_id || null,
            linkedAt: link?.linked_at || null,
            updatedAt: link?.updated_at || null
        });
    } catch (error: unknown) {
        return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
        const bridgeConfig = await getDiscordBridgeConfig();
        if (!bridgeConfig.enabled) {
            return json({ error: "bridge-disabled" }, 503);
        }
        if (!bridgeConfig.oauthClientId || !bridgeConfig.oauthRedirectUri) {
            return json({ error: "oauth-not-configured" }, 503);
        }

        const existing = await getDiscordLinkByUserId(session.user.id);
        if (existing?.discord_user_id) {
            return json({
                linked: true,
                discordUserId: existing.discord_user_id,
                discordUsername: existing.discord_username || null,
                linkedAt: existing.linked_at || null,
                message: "already-linked"
            });
        }

        const state = createDiscordOauthStateToken();
        await createDiscordOauthState({
            state,
            userId: session.user.id
        });

        const fromEnv = String(process.env.NEXTAUTH_URL || "").trim();
        const fromConfig = String(bridgeConfig?.publicBaseUrl || "").trim();
        const fromOrigin = new URL(req.url).origin;
        const publicBaseUrl = (fromEnv || fromConfig || fromOrigin).replace(/\/+$/, "");

        const authorizeUrl = `${publicBaseUrl}/api/discord/oauth/start?state=${encodeURIComponent(state)}`;

        return json({
            linked: false,
            state,
            authorizeUrl
        });
    } catch (error: unknown) {
        return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return json({ error: "Unauthorized" }, 401);
    }

    try {
        await unlinkDiscordAccountFromUser(session.user.id);
        return json({ success: true, linked: false });
    } catch (error: unknown) {
        return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}
