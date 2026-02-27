import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";
import {
    consumeDiscordOauthState,
    getDiscordOauthState,
    linkDiscordAccountToUser,
    enqueueRoleSync
} from "@/lib/discord-bridge-service";

function isExpired(dateValue) {
    if (!dateValue) return true;
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) || date.getTime() < Date.now();
}

function resolvePublicBaseUrl(bridgeConfig, req) {
    const fromConfig = String(bridgeConfig?.publicBaseUrl || "").trim();
    const fromEnv = String(process.env.NEXTAUTH_URL || "").trim();
    const selected = fromConfig || fromEnv || new URL(req.url).origin;
    return selected.replace(/\/+$/, "");
}

function redirectWithCode(baseUrl, code) {
    const url = new URL("/dashboard", baseUrl);
    url.searchParams.set("view", "my-profile");
    url.searchParams.set("discord", code);
    return Response.redirect(url);
}

export async function GET(req) {
    const bridgeConfig = await getDiscordBridgeConfig();
    const baseUrl = resolvePublicBaseUrl(bridgeConfig, req);
    const url = new URL(req.url);
    const state = String(url.searchParams.get("state") || "").trim();
    const code = String(url.searchParams.get("code") || "").trim();

    if (!state || !code) {
        return redirectWithCode(baseUrl, "oauth-missing");
    }

    const stateRow = await getDiscordOauthState(state);
    if (!stateRow || stateRow.consumed_at || isExpired(stateRow.expires_at)) {
        return redirectWithCode(baseUrl, "invalid-state");
    }

    let userId = stateRow.user_id;
    if (!userId) {
        const session = await getServerSession(authOptions);
        userId = session?.user?.id || null;
    }

    if (!userId) {
        return redirectWithCode(baseUrl, "session-required");
    }

    if (!bridgeConfig.enabled) {
        return redirectWithCode(baseUrl, "bridge-disabled");
    }

    if (!bridgeConfig.oauthClientId || !bridgeConfig.oauthClientSecret || !bridgeConfig.oauthRedirectUri) {
        return redirectWithCode(baseUrl, "oauth-not-configured");
    }

    try {
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: bridgeConfig.oauthClientId,
                client_secret: bridgeConfig.oauthClientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: bridgeConfig.oauthRedirectUri
            })
        });

        if (!tokenResponse.ok) {
            return redirectWithCode(baseUrl, "token-exchange-failed");
        }

        const tokenPayload = await tokenResponse.json();
        if (!tokenPayload?.access_token) {
            return redirectWithCode(baseUrl, "token-missing");
        }

        const meResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenPayload.access_token}`
            }
        });

        if (!meResponse.ok) {
            return redirectWithCode(baseUrl, "identify-failed");
        }

        const discordUser = await meResponse.json();
        if (!discordUser?.id) {
            return redirectWithCode(baseUrl, "identify-empty");
        }

        await linkDiscordAccountToUser({
            userId,
            discordUserId: String(discordUser.id),
            discordUsername: discordUser.username
                ? `${discordUser.username}${discordUser.discriminator && discordUser.discriminator !== "0" ? `#${discordUser.discriminator}` : ""}`
                : null,
            discordAvatar: discordUser.avatar,
            guildId: null
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });

        if (user) {
            await enqueueRoleSync({
                userId: user.id,
                discordUserId: String(discordUser.id),
                role: user.role
            });
        }

        await consumeDiscordOauthState(state);
        return redirectWithCode(baseUrl, "linked");
    } catch (error) {
        if (error?.code === "DISCORD_ACCOUNT_ALREADY_LINKED") {
            return redirectWithCode(baseUrl, "already-linked");
        }

        console.error("Discord OAuth callback error:", error);
        return redirectWithCode(baseUrl, "link-failed");
    }
}
