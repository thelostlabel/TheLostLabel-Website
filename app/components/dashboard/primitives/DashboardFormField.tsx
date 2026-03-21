"use client";

import type { ReactNode } from "react";

type DashboardFormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export default function DashboardFormField({
  label,
  error,
  children,
  className = "",
}: DashboardFormFieldProps) {
  return (
    <div className={className}>
      <label className="dash-label block">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}
