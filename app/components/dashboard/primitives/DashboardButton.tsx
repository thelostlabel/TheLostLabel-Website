"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "danger" | "ghost";
type Size = "sm" | "md";

type DashboardButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
};

const variantClass: Record<Variant, string> = {
  default: "dash-btn",
  primary: "dash-btn-primary",
  danger: "dash-btn-danger",
  ghost:
    "bg-transparent border-none text-white/60 hover:text-white cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-[800] tracking-[1.5px] transition-all duration-300",
};

const sizeClass: Record<Size, string> = {
  sm: "!py-[6px] !px-[10px] !text-[9px]",
  md: "",
};

export default function DashboardButton({
  variant = "default",
  size = "md",
  icon,
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: DashboardButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${sizeClass[size]} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-label="Loading"
        />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
