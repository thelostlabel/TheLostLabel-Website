import { NextRequest } from "next/server";
import { POST as canonicalPost } from "@/app/api/internal/discord/link-url/route";
import { logDeprecatedDiscordRoute } from "@/lib/discord-route-deprecation";

export async function POST(req: NextRequest, context: unknown) {
    logDeprecatedDiscordRoute("/api/internal/discord/link_url", "/api/internal/discord/link-url");
    return canonicalPost(req, context);
}
