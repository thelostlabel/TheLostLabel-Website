/**
 * Artist shared utilities and theme bridge.
 * Style objects are now re-exported from the unified theme.
 * Utility functions (getBaseTitle, resolveImageSrc, etc.) remain here.
 */

import {
  DASHBOARD_COLORS,
  glassStyle as _glassStyle,
  btnStyle as _btnStyle,
  inputStyle as _inputStyle,
} from "@/app/components/dashboard/lib/theme";

/** @deprecated Use DASHBOARD_COLORS from lib/theme instead */
export const DASHBOARD_THEME = DASHBOARD_COLORS;

/** @deprecated Use Tailwind class `glass-card` instead */
export const glassStyle = _glassStyle;

/** @deprecated Use Tailwind class `dash-btn` instead */
export const btnStyle = _btnStyle;

/** @deprecated Use Tailwind class `dash-input` instead */
export const inputStyle = _inputStyle;

export const FALLBACK_IMAGE = "/default-album.jpg";

export const getBaseTitle = (title?: string | null) => {
  if (!title) return "";
  return title
    .split("(")[0]
    .split("-")[0]
    .replace(/\d{4}\s*REMASTER/gi, "")
    .replace(/SLOWED\s*\+\s*REVERB/gi, "")
    .replace(/ULTRA\s*SLOWED/gi, "")
    .replace(/SPEED\s*UP/gi, "")
    .replace(/ACOUSTIC/gi, "")
    .replace(/LIVE/gi, "")
    .replace(/REMASTERED/gi, "")
    .trim();
};

export const resolveImageSrc = (src: unknown, releaseId: string | null = null) => {
  if (typeof src !== "string") return FALLBACK_IMAGE;
  const trimmed = src.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith("private/")) {
    return releaseId ? `/api/files/release/${releaseId}` : FALLBACK_IMAGE;
  }
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return FALLBACK_IMAGE;
};

export const handleImageError = (event: { currentTarget: HTMLImageElement }) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = FALLBACK_IMAGE;
};

export const artistSharedViewProps = {
  DASHBOARD_THEME,
  glassStyle,
  btnStyle,
  inputStyle,
  getBaseTitle,
  resolveImageSrc,
  handleImageError,
};

export type ArtistSharedViewProps = typeof artistSharedViewProps;
