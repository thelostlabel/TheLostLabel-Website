import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";
import { attachUserToDiscordOauthState, getDiscordOauthState } from "@/lib/discord-bridge-service";

function isExpired(dateValue) {
    if (!dateValue) return true;
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) || date.getTime() < Date.now();
}

function buildDashboardRedirect(req, code) {
    const url = new URL("/dashboard", req.url);
    url.searchParams.set("view", "my-profile");
    url.searchParams.set("discord", code);
    return url;
}

function buildLoginRedirect(req, callbackPath) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return loginUrl;
}

export async function GET(req) {
    const url = new URL(req.url);
    const state = String(url.searchParams.get("state") || "").trim();

    if (!state) {
        return Response.redirect(buildDashboardRedirect(req, "missing-state"));
    }

    const stateRow = await getDiscordOauthState(state);
    if (!stateRow || stateRow.consumed_at || isExpired(stateRow.expires_at)) {
        return Response.redirect(buildDashboardRedirect(req, "invalid-state"));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const callbackPath = `/api/discord/oauth/start?state=${encodeURIComponent(state)}`;
        return Response.redirect(buildLoginRedirect(req, callbackPath));
    }

    await attachUserToDiscordOauthState({
        state,
        userId: session.user.id
    });

    const bridgeConfig = await getDiscordBridgeConfig();
    if (!bridgeConfig.enabled) {
        return Response.redirect(buildDashboardRedirect(req, "bridge-disabled"));
    }

    if (!bridgeConfig.oauthClientId || !bridgeConfig.oauthRedirectUri) {
        return Response.redirect(buildDashboardRedirect(req, "oauth-not-configured"));
    }

    const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
    authorizeUrl.searchParams.set("client_id", bridgeConfig.oauthClientId);
    authorizeUrl.searchParams.set("redirect_uri", bridgeConfig.oauthRedirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "identify");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("prompt", "consent");

    return Response.redirect(authorizeUrl);
}
