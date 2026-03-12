"use client";

type DashboardErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  compact?: boolean;
};

export default function DashboardErrorState({
  title,
  message,
  actionLabel = "Retry",
  onAction,
  compact = false,
}: DashboardErrorStateProps) {
  return (
    <div
      className="dashboard-error-state"
      style={{
        minHeight: compact ? "auto" : "50vh",
        display: "grid",
        placeItems: "center",
        padding: compact ? "20px" : "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: compact ? "100%" : "520px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: compact ? "20px" : "28px",
          textAlign: compact ? "left" : "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
          }}
        >
          Dashboard Error
        </p>
        <h2
          style={{
            margin: "10px 0 0",
            fontSize: compact ? "18px" : "24px",
            fontWeight: 900,
            color: "#fff",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.68)",
          }}
        >
          {message}
        </p>
        {onAction ? (
          <button
            type="button"
            onClick={() => {
              void onAction();
            }}
            style={{
              marginTop: "18px",
              minWidth: "140px",
              height: "42px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
