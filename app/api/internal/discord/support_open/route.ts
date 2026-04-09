import { NextRequest } from "next/server";
import { POST as canonicalPost } from "@/app/api/internal/discord/support-open/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req: NextRequest, context: unknown) {
    logDeprecatedDiscordRoute("/api/internal/discord/support_open", "/api/internal/discord/support-open");
    return canonicalPost(req, context);
}
