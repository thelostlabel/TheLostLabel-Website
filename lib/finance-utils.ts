import type { AppRole } from "@/lib/auth-types";
import type { NumericLike } from "@/lib/finance-types";

export function toNumber(value: NumericLike): number {
  return Number(value ?? 0);
}

export function parseFloatInput(value: string | number | null | undefined): number {
  return Number.parseFloat(String(value));
}

export function parseIntegerInput(value: string | number | null | undefined): number {
  return Number.parseInt(String(value), 10);
}

export function hasAdminOrArRole(role: AppRole | null | undefined): boolean {
  return role === "admin" || role === "a&r";
}

export function extractSpotifyArtistIdFromUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const parts = url.split("/").filter((segment) => segment.trim() !== "");
  const lastPart = parts.pop() ?? "";
  const spotifyId = lastPart.split("?")[0]?.trim();

  return spotifyId || null;
}

export function getErrorMessage(error: unknown, fallback = "Internal Server Error"): string {
  return error instanceof Error ? error.message : fallback;
}
