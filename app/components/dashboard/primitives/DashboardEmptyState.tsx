"use client";

import type { ReactNode } from "react";

type DashboardEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function DashboardEmptyState({
  title,
  description,
  icon,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 px-6 text-center">
      {icon ? <div className="mb-[18px] opacity-[0.72]">{icon}</div> : null}
      <p className="m-0 text-xs text-white font-[900] tracking-[0.16em] uppercase">
        {title}
      </p>
      {description ? (
        <p className="mt-2.5 mx-auto max-w-[460px] text-xs text-white/[0.48] leading-[1.7]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-[18px]">{action}</div> : null}
    </div>
  );
}
