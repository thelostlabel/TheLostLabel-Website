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
      metadata: { digest: error.digest },
    }),
  }).catch(() => {});
}

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#999",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "#1a1a1a",
              color: "#e5e5e5",
              border: "1px solid #333",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
