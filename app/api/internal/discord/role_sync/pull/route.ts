import { NextRequest } from "next/server";
import { POST as canonicalPost } from "@/app/api/internal/discord/role-sync/pull/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req: NextRequest, context: unknown) {
    logDeprecatedDiscordRoute("/api/internal/discord/role_sync/pull", "/api/internal/discord/role-sync/pull");
    return canonicalPost(req, context);
}
