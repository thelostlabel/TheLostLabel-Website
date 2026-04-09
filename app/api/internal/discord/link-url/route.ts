import { NextRequest } from "next/server";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { createDiscordOauthState, createDiscordOauthStateToken } from "@/lib/discord-bridge-service";

function normalizeBaseUrl(value: string | undefined | null): string {
    const fallback = "http://localhost:3000";
    const selected = String(value || fallback).trim() || fallback;
    return selected.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: true });
    if (!auth.ok) return auth.response;

    const { body, config } = auth;

    try {
        const discordUserId = String(
            body?.discordUserId ||
            body?.discord_user_id ||
            auth.discordUserId ||
            ""
        ).trim();
        const discordUsername = String(body?.discordUsername || body?.discord_username || "").trim() || null;

        if (!discordUserId) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "discordUserId is required." }, 400);
        }

        const state = createDiscordOauthStateToken();
        const created = await createDiscordOauthState({
            state,
            discordUserId,
            discordUsername
        });

        const publicBaseUrl = normalizeBaseUrl(config.publicBaseUrl);
        const authorizeUrl = `${publicBaseUrl}/api/discord/oauth/start?state=${encodeURIComponent(state)}`;

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            state,
            authorizeUrl,
            expiresAt: created.expiresAt,
            message: "Send this URL to the user and ask them to sign in to link accounts."
        });
    } catch (error: unknown) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}
