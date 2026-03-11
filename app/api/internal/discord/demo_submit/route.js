import { POST as canonicalPost } from "@/app/api/internal/discord/demo-submit/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req, context) {
    logDeprecatedDiscordRoute("/api/internal/discord/demo_submit", "/api/internal/discord/demo-submit");
    return canonicalPost(req, context);
}
