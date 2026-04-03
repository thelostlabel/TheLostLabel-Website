"use client";

import { useEffect, useState } from "react";

/**
 * SoundCloudPlayer
 * Fetches the correct embed HTML from SoundCloud's oEmbed API (server-side proxy)
 * and renders it. No API key required.
 */
export default function SoundCloudPlayer({ url, className = "" }) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    setHtml(null);
    setError(false);

    fetch(`/api/soundcloud/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.html) {
          // Force 100% width regardless of what oEmbed returns
          const responsive = data.html.replace(/width="\d+"/i, 'width="100%"');
          setHtml(responsive);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [url]);

  if (error) {
    return (
      <div className={`soundcloud-error ${className}`}>
        <p style={{ fontSize: 13, color: "var(--ds-text-muted, #888)", textAlign: "center", padding: "16px 0" }}>
          Could not load SoundCloud player.
        </p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className={`soundcloud-loading ${className}`} style={{ height: 166, borderRadius: 12, background: "var(--ds-item-bg, rgba(255,255,255,0.04))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "var(--ds-text-muted, #666)", textTransform: "uppercase" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`soundcloud-embed ${className}`}
      // oEmbed returns a full <iframe ...> string — safe to render as-is
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ borderRadius: 12, overflow: "hidden", width: "100%" }}
    />
  );
}

/**
 * Returns true if the given string looks like a SoundCloud URL.
 */
export function isSoundCloudUrl(url) {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "soundcloud.com" || hostname === "www.soundcloud.com" || hostname === "on.soundcloud.com";
  } catch {
    return false;
  }
}
