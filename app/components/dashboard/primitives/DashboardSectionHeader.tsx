"use client";

import type { ReactNode } from "react";

type DashboardSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export default function DashboardSectionHeader({
  eyebrow,
  title,
  action,
}: DashboardSectionHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4 mb-[18px]">
      <div>
        {eyebrow ? (
          <p className="m-0 text-[10px] text-white/[0.32] tracking-[0.18em] font-bold">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`${eyebrow ? "mt-2" : "m-0"} text-[22px] tracking-[0.02em] font-[900] text-white`}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
