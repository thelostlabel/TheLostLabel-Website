import { NextRequest } from "next/server";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";

export async function POST(req: NextRequest) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        await auth.finish({ status: 200, success: true });
        return discordInternalJson({
            runtime: auth.config?.botRuntime || {},
            defaults: {
                guildId: auth.config?.defaultGuildId || null
            }
        });
    } catch (error: unknown) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}
