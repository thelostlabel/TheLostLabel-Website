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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "18px",
      }}
    >
      <div>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: "rgba(255,255,255,0.32)",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          style={{
            margin: eyebrow ? "8px 0 0" : 0,
            fontSize: "22px",
            letterSpacing: "0.02em",
            fontWeight: 900,
            color: "#fff",
          }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
