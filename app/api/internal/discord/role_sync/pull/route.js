import { POST as canonicalPost } from "@/app/api/internal/discord/role-sync/pull/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req, context) {
    logDeprecatedDiscordRoute("/api/internal/discord/role_sync/pull", "/api/internal/discord/role-sync/pull");
    return canonicalPost(req, context);
}
