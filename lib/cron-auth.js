import crypto from "crypto";

function getBearerToken(req) {
    const header = req?.headers?.get?.("authorization") || "";
    if (!header.startsWith("Bearer ")) return "";
    return header.slice("Bearer ".length).trim();
}

function timingSafeSecretEquals(a, b) {
    if (!a || !b) return false;

    const left = Buffer.from(String(a), "utf8");
    const right = Buffer.from(String(b), "utf8");
    if (left.length !== right.length) return false;

    return crypto.timingSafeEqual(left, right);
}

export function hasValidCronAuthorization(req) {
    const expected = String(process.env.CRON_SECRET || "").trim();
    if (!expected) return false;

    // 1. Try Authorization: Bearer header
    const bearer = getBearerToken(req);
    if (bearer && timingSafeSecretEquals(bearer, expected)) return true;

    // 2. Fallback: ?secret= query parameter
    try {
        const url = new URL(req.url);
        const querySecret = url.searchParams.get("secret") || "";
        if (querySecret && timingSafeSecretEquals(querySecret, expected)) return true;
    } catch { /* ignore malformed URL */ }

    return false;
}
