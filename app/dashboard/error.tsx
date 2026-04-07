"use client";

import { useEffect } from "react";

function reportError(error: Error & { digest?: string }) {
  fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      source: "client",
      metadata: { digest: error.digest, section: "dashboard" },
    }),
  }).catch(() => {});
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-[14px] font-black uppercase tracking-[0.15em] text-foreground">
          Something went wrong
        </h2>
        <p className="text-[12px] leading-relaxed ds-text-muted">
          An unexpected error occurred in the dashboard. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-xl border border-default/15 bg-default/8 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-default/15"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
