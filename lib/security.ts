import crypto from "crypto";

import type { RateLimiter } from "@/lib/rate-limit";

export const MIN_PASSWORD_LENGTH = 8;

type HeaderReader = {
  get?: (name: string) => string | null | undefined;
};

type RequestLike = {
  headers?: HeaderReader | null;
};

function normalizeKeyPart(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim().toLowerCase().slice(0, 160);
}

export function normalizeEmail(value: unknown): string {
  return normalizeKeyPart(value);
}

export function hasMinimumPasswordLength(password: unknown): password is string {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashOpaqueToken(token: unknown): string {
  return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

export function getClientIp(reqLike: RequestLike | null | undefined): string {
  const headers = reqLike?.headers;
  if (!headers?.get) return "unknown";

  const forwardedFor = headers.get("x-forwarded-for") || "";
  const cfIp = headers.get("cf-connecting-ip") || "";
  const realIp = headers.get("x-real-ip") || "";
  const candidate = forwardedFor.split(",")[0]?.trim() || cfIp.trim() || realIp.trim();

  return candidate || "unknown";
}

export function buildRateLimitKey(reqLike: RequestLike | null | undefined, scope: unknown, ...parts: unknown[]): string {
  return [
    normalizeKeyPart(scope),
    normalizeKeyPart(getClientIp(reqLike)),
    ...parts.map(normalizeKeyPart).filter(Boolean),
  ].join(":");
}

export async function passesRateLimit(limiter: RateLimiter, limit: number, key: string): Promise<boolean> {
  try {
    await limiter.check(null, limit, key);
    return true;
  } catch {
    return false;
  }
}
