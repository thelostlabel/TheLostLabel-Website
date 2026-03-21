"use client";

import type { HTMLAttributes } from "react";

type CardVariant = "default" | "stat" | "section";

type DashboardCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantClass: Record<CardVariant, string> = {
  default: "glass-card p-5 relative",
  stat: "glass-card p-5 relative",
  section: "glass-section",
};

export default function DashboardCard({
  variant = "default",
  className = "",
  children,
  ...rest
}: DashboardCardProps) {
  return (
    <div className={`${variantClass[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
