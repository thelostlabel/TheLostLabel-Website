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
      className="dashboard-error-state grid place-items-center"
      style={{
        minHeight: compact ? "auto" : "50vh",
        padding: compact ? "20px" : "40px",
      }}
    >
      <div
        className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.03]"
        style={{
          maxWidth: compact ? "100%" : "520px",
          padding: compact ? "20px" : "28px",
          textAlign: compact ? "left" : "center",
        }}
      >
        <p className="m-0 text-[11px] font-[900] tracking-[0.16em] text-white/[0.55] uppercase">
          Dashboard Error
        </p>
        <h2
          className="mt-2.5 font-[900] text-white"
          style={{ fontSize: compact ? "18px" : "24px" }}
        >
          {title}
        </h2>
        <p className="mt-2.5 text-[13px] leading-relaxed text-white/[0.68]">
          {message}
        </p>
        {onAction ? (
          <button
            type="button"
            onClick={() => { void onAction(); }}
            className="dash-btn mt-[18px] min-w-[140px] h-[42px]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
