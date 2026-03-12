"use client";

type DashboardInlineAlertProps = {
  message: string;
};

export default function DashboardInlineAlert({ message }: DashboardInlineAlertProps) {
  if (!message) return null;

  return (
    <div
      style={{
        marginBottom: "14px",
        borderRadius: "14px",
        border: "1px solid rgba(245, 158, 11, 0.24)",
        background: "rgba(245, 158, 11, 0.08)",
        padding: "12px 14px",
        fontSize: "12px",
        fontWeight: 700,
        color: "#fcd34d",
      }}
    >
      {message}
    </div>
  );
}
