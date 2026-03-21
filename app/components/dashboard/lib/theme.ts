import type { CSSProperties } from "react";

/**
 * Unified dashboard theme — single source of truth.
 * CSS variables in globals.css are the canonical tokens.
 * This file provides JS constants for cases where CSS variables
 * can't be used (e.g. Recharts, dynamic calculations).
 */

export const DASHBOARD_COLORS = {
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
  info: "#3B82F6",
  neutral: "#888888",
} as const;

/** @deprecated Use Tailwind class `glass-card` instead */
export const glassStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  overflow: "hidden",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
};

/** @deprecated Use Tailwind class `glass-card p-5` instead */
export const glassCardStyle: CSSProperties = {
  ...glassStyle,
  padding: "20px",
  position: "relative",
};

/** @deprecated Use Tailwind class `glass-card p-5` instead */
export const statCardStyle: CSSProperties = {
  ...glassStyle,
  padding: "20px",
  position: "relative",
};

/** @deprecated Use Tailwind class `glass-section` instead */
export const glassSectionStyle: CSSProperties = {
  ...glassStyle,
  padding: "24px",
  position: "relative",
};

/** @deprecated Use Tailwind class `dash-th` instead */
export const thStyle: CSSProperties = {
  padding: "12px 14px",
  fontSize: "10px",
  letterSpacing: "1.5px",
  color: "rgba(255,255,255,0.35)",
  fontWeight: "800",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  textTransform: "uppercase",
};

/** @deprecated Use Tailwind class `dash-td` instead */
export const tdStyle: CSSProperties = {
  padding: "12px 14px",
  fontSize: "12px",
  color: "#D1D5DB",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  fontWeight: "600",
};

/** @deprecated Use Tailwind class `dash-btn` instead */
export const btnStyle: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "9px 16px",
  fontSize: "10px",
  cursor: "pointer",
  fontWeight: "800",
  letterSpacing: "1.5px",
  textDecoration: "none",
  borderRadius: "10px",
  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

/** @deprecated Use Tailwind class `dash-btn-primary` instead */
export const btnPrimaryStyle: CSSProperties = {
  ...btnStyle,
  background: "#fff",
  color: "#000",
  border: "none",
  fontWeight: "900",
};

/** @deprecated Use Tailwind class `dash-input` instead */
export const inputStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "11px 14px",
  borderRadius: "10px",
  fontSize: "12px",
  width: "100%",
  outline: "none",
  transition: "all 0.2s ease",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

/** @deprecated Use Tailwind class `dash-modal-overlay` instead */
export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** @deprecated Use Tailwind class `dash-modal` instead */
export const modalStyle: CSSProperties = {
  ...glassStyle,
  background: "rgba(15,15,15,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "24px",
  maxWidth: "600px",
  width: "90%",
  maxHeight: "85vh",
  overflowY: "auto",
};

/** @deprecated Use Tailwind class `glass-card p-0` instead */
export const tableContainerStyle: CSSProperties = {
  ...glassStyle,
  padding: 0,
};
