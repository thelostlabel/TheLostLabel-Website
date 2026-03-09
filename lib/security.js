import crypto from "crypto";

export const MIN_PASSWORD_LENGTH = 8;

function normalizeKeyPart(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim().toLowerCase().slice(0, 160);
}

export function normalizeEmail(value) {
    return normalizeKeyPart(value);
}

export function hasMinimumPasswordLength(password) {
    return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

export function generateOpaqueToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}

export function hashOpaqueToken(token) {
    return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

export function getClientIp(reqLike) {
    const headers = reqLike?.headers;
    if (!headers?.get) return "unknown";

    const forwardedFor = headers.get("x-forwarded-for") || "";
    const cfIp = headers.get("cf-connecting-ip") || "";
    const realIp = headers.get("x-real-ip") || "";
    const candidate = forwardedFor.split(",")[0]?.trim() || cfIp.trim() || realIp.trim();

    return candidate || "unknown";
}

export function buildRateLimitKey(reqLike, scope, ...parts) {
    return [
        normalizeKeyPart(scope),
        normalizeKeyPart(getClientIp(reqLike)),
        ...parts.map(normalizeKeyPart).filter(Boolean)
    ].join(":");
}

export async function passesRateLimit(limiter, limit, key) {
    try {
        await limiter.check(null, limit, key);
        return true;
    } catch {
        return false;
    }
}
