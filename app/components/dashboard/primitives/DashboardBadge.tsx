"use client";

import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

type DashboardBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
};

const variantClass: Record<BadgeVariant, string> = {
  success: "dash-badge dash-badge-success",
  warning: "dash-badge dash-badge-warning",
  error: "dash-badge dash-badge-error",
  info: "dash-badge dash-badge-info",
  neutral: "dash-badge dash-badge-neutral",
};

export default function DashboardBadge({
  variant = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}: DashboardBadgeProps) {
  return (
    <span className={`${variantClass[variant]} ${className}`} {...rest}>
      {dot && (
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}
