import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";
import {
    createDiscordOauthState,
    createDiscordOauthStateToken,
    getDiscordLinkByUserId,
    unlinkDiscordAccountFromUser
} from "@/lib/discord-bridge-service";

function json(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

function normalizeBaseUrl(value) {
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
    } catch (error) {
        return json({ error: error.message || "Failed to fetch Discord link state." }, 500);
    }
}

export async function POST() {
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

        const publicBaseUrl = normalizeBaseUrl(bridgeConfig.publicBaseUrl);
        const authorizeUrl = `${publicBaseUrl}/api/discord/oauth/start?state=${encodeURIComponent(state)}`;

        return json({
            linked: false,
            state,
            authorizeUrl
        });
    } catch (error) {
        return json({ error: error.message || "Failed to create Discord OAuth link URL." }, 500);
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
    } catch (error) {
        return json({ error: error.message || "Failed to unlink Discord account." }, 500);
    }
}

