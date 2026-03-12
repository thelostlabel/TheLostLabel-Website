import type { CSSProperties } from "react";

export const DASHBOARD_THEME = {
  bg: "transparent",
  surface: "rgba(255,255,255,0.03)",
  surfaceElevated: "rgba(255,255,255,0.05)",
  surfaceSoft: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.15)",
  text: "#FFFFFF",
  muted: "#888888",
  accent: "#D1D5DB",
  accentHover: "#E5E7EB",
  accentDark: "#9CA3AF",
  accentAlt: "#6B7280",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export const glassStyle: CSSProperties = {
  background: "#0E0E0E",
  border: `1px solid ${DASHBOARD_THEME.border}`,
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 16px 38px rgba(0, 0, 0, 0.4)",
};

export const btnStyle: CSSProperties = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: `1px solid ${DASHBOARD_THEME.border}`,
  color: DASHBOARD_THEME.text,
  padding: "9px 14px",
  fontSize: "11px",
  cursor: "pointer",
  fontWeight: 900,
  letterSpacing: "0.8px",
  borderRadius: "9px",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
  border: `1px solid ${DASHBOARD_THEME.border}`,
  color: DASHBOARD_THEME.text,
  fontSize: "12px",
  fontWeight: 700,
  borderRadius: "10px",
  outline: "none",
  transition: "all 0.2s",
  letterSpacing: "0.5px",
};

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
