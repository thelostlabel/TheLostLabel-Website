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
    <div
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      {icon ? <div style={{ marginBottom: "18px", opacity: 0.72 }}>{icon}</div> : null}
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#fff",
          fontWeight: 900,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </p>
      {description ? (
        <p
          style={{
            margin: "10px auto 0",
            maxWidth: "460px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.48)",
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "18px" }}>{action}</div> : null}
    </div>
  );
}
