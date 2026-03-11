import { POST as canonicalPost } from "@/app/api/internal/discord/support-open/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req, context) {
    logDeprecatedDiscordRoute("/api/internal/discord/support_open", "/api/internal/discord/support-open");
    return canonicalPost(req, context);
}
