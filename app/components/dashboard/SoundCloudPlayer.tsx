"use client";

import { useEffect, useState } from "react";

interface SoundCloudPlayerProps {
  url: string;
  className?: string;
}

export default function SoundCloudPlayer({ url, className = "" }: SoundCloudPlayerProps) {
  const [html, setHtml] = useState<string | null>(null);
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
        <p className="text-[13px] text-center py-4 ds-text-muted">
          Could not load SoundCloud player.
        </p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className={`soundcloud-loading h-[166px] rounded-xl bg-[var(--ds-item-bg)] flex items-center justify-center ${className}`}>
        <span className="text-[11px] font-bold tracking-[1.5px] uppercase ds-text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div
      // oEmbed returns a full <iframe ...> string — safe to render as-is
      dangerouslySetInnerHTML={{ __html: html }}
      className={`soundcloud-embed rounded-xl overflow-hidden w-full ${className}`}
    />
  );
}

export function isSoundCloudUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "soundcloud.com" || hostname === "www.soundcloud.com" || hostname === "on.soundcloud.com";
  } catch {
    return false;
  }
}
