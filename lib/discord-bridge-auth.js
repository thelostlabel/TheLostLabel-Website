import crypto from "crypto";
import rateLimit from "@/lib/rate-limit";
import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";
import { ensureDiscordBridgeTables } from "@/lib/discord-bridge-db";
import { auditDiscordInternalRequest, isDiscordSignatureReplay } from "@/lib/discord-bridge-service";

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;
const internalRateLimiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 2000
});

function sha256Hex(input) {
    return crypto.createHash("sha256").update(input || "", "utf8").digest("hex");
}

function hmacHex(secret, message) {
    return crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

function timingSafeEqualText(a, b) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

export async function authenticateDiscordInternalRequest(req, options = {}) {
    const { requireJsonBody = false } = options;

    await ensureDiscordBridgeTables();

    const bridgeConfig = await getDiscordBridgeConfig();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method.toUpperCase();

    const requestId = req.headers.get("x-lost-bot-request-id") || crypto.randomUUID();
    const botToken = req.headers.get("x-lost-bot-token") || "";
    const timestampHeader = req.headers.get("x-lost-bot-timestamp") || "";
    const signature = req.headers.get("x-lost-bot-signature") || "";
    const discordUserId = req.headers.get("x-lost-discord-user-id") || null;
    const guildId = req.headers.get("x-lost-discord-guild-id") || null;

    const fail = async (status, error) => {
        await auditDiscordInternalRequest({
            requestId,
            endpoint,
            method,
            discordUserId,
            guildId,
            success: false,
            statusCode: status,
            signature
        });
        return {
            ok: false,
            response: jsonResponse({ error }, status)
        };
    };

    if (!bridgeConfig.enabled) {
        return fail(503, "Discord bridge is disabled.");
    }

    if (!bridgeConfig.internalToken || !bridgeConfig.internalSigningSecret) {
        return fail(503, "Discord bridge internal credentials are not configured.");
    }

    try {
        await internalRateLimiter.check(null, 160, `${discordUserId || "unknown"}:${endpoint}`);
    } catch {
        return fail(429, "Rate limit exceeded.");
    }

    if (!timingSafeEqualText(sha256Hex(botToken), sha256Hex(bridgeConfig.internalToken))) {
        return fail(401, "Invalid bot token.");
    }

    const timestamp = Number(timestampHeader);
    if (!Number.isFinite(timestamp)) {
        return fail(401, "Missing or invalid timestamp.");
    }

    if (Math.abs(Date.now() - timestamp) > MAX_TIMESTAMP_DRIFT_MS) {
        return fail(401, "Timestamp drift too large.");
    }

    const rawBody = await req.text();
    if (requireJsonBody && !rawBody) {
        return fail(400, "Request body is required.");
    }

    const bodyHash = sha256Hex(rawBody);
    const expectedSignature = hmacHex(
        bridgeConfig.internalSigningSecret,
        `${timestamp}.${method}.${endpoint}.${bodyHash}`
    );

    if (!timingSafeEqualText(signature, expectedSignature)) {
        return fail(401, "Invalid request signature.");
    }

    if (await isDiscordSignatureReplay(signature)) {
        return fail(409, "Replay detected.");
    }

    let body = null;
    if (rawBody) {
        try {
            body = JSON.parse(rawBody);
        } catch {
            return fail(400, "Invalid JSON body.");
        }
    }

    const finish = async ({ status = 200, success = true } = {}) => {
        await auditDiscordInternalRequest({
            requestId,
            endpoint,
            method,
            discordUserId,
            guildId,
            success,
            statusCode: status,
            signature
        });
    };

    return {
        ok: true,
        requestId,
        endpoint,
        method,
        body,
        rawBody,
        signature,
        discordUserId,
        guildId,
        config: bridgeConfig,
        finish,
        json: jsonResponse
    };
}

export function discordInternalJson(payload, status = 200) {
    return jsonResponse(payload, status);
}
