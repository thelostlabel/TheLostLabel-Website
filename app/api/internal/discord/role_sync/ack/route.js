import { POST as canonicalPost } from "@/app/api/internal/discord/role-sync/ack/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req, context) {
    logDeprecatedDiscordRoute("/api/internal/discord/role_sync/ack", "/api/internal/discord/role-sync/ack");
    return canonicalPost(req, context);
}
