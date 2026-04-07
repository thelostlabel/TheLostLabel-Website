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
    <div className="rounded-2xl border border-border/30 bg-default/5 py-12 px-6 text-center">
      {icon ? <div className="mb-[18px] opacity-60">{icon}</div> : null}
      <p className="m-0 text-xs font-[900] tracking-[0.16em] uppercase ds-text">
        {title}
      </p>
      {description ? (
        <p className="mt-2.5 mx-auto max-w-[460px] text-xs ds-text-muted leading-[1.7]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-[18px]">{action}</div> : null}
    </div>
  );
}
