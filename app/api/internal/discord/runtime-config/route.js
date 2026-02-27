import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";

export async function POST(req) {
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
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to load runtime config." }, 500);
    }
}
