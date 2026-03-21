"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface WaveformPlayerProps {
  src: string;
  filename?: string;
}

export default function WaveformPlayer({ src, filename }: WaveformPlayerProps) {
  return <WaveformPlayerInner key={src} src={src} filename={filename} />;
}

function WaveformPlayerInner({ src, filename }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fetch audio as a complete blob to avoid ERR_REQUEST_RANGE_NOT_SATISFIABLE.
  // Pass the Blob directly to WaveSurfer so it doesn't try to fetch a blob: URL,
  // which would be blocked by the app CSP.
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setAudioBlob(null);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        setAudioBlob(blob);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Audio file could not be loaded.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!audioBlob || !containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255,255,255,0.12)",
      progressColor: "rgba(255,255,255,0.72)",
      cursorColor: "#ffffff",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 64,
      normalize: true,
      interact: true,
    });

    wsRef.current = ws;

    ws.loadBlob(audioBlob);

    ws.on("ready", (dur) => {
      setDuration(dur);
      setIsLoading(false);
      setIsReady(true);
      ws.setVolume(volume ** 2);
    });

    ws.on("audioprocess", (t) => setCurrentTime(t));
    ws.on("seeking", (t) => setCurrentTime(t));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => {
      setIsPlaying(false);
      if (isLoop) ws.play();
      else setCurrentTime(0);
    });
    ws.on("error", () => {
      setError("Audio file could not be loaded.");
      setIsLoading(false);
    });

    return () => {
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  // Sync volume
  useEffect(() => {
    if (!wsRef.current) return;
    if (isMuted) {
      wsRef.current.setVolume(0);
    } else {
      wsRef.current.setVolume(volume ** 2);
    }
  }, [volume, isMuted]);

  // CSS variable for volume slider fill
  useEffect(() => {
    if (volumeSliderRef.current) {
      const pct = isMuted ? 0 : Math.round(volume * 100);
      volumeSliderRef.current.style.setProperty("--vol", `${pct}%`);
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(async () => {
    if (!wsRef.current || !isReady) return;
    await wsRef.current.playPause();
  }, [isReady]);

  const skip = useCallback((delta: number) => {
    if (!wsRef.current) return;
    const t = wsRef.current.getCurrentTime();
    wsRef.current.setTime(Math.max(0, Math.min(t + delta, duration)));
  }, [duration]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const displayVol = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Track name row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "14px", flexShrink: 0 }}>
          {[0, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
            <div
              key={i}
              style={{
                width: "3px",
                borderRadius: "1px",
                background: isPlaying ? "#d1d5db" : "#333",
                height: isPlaying ? undefined : "4px",
                animation: isPlaying ? `wsbar 0.8s ${delay}s ease-in-out infinite alternate` : "none",
              }}
            />
          ))}
        </div>
        <span style={{
          fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px",
          color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {filename?.toUpperCase() ?? "UNKNOWN TRACK"}
        </span>
        {isLoading && (
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#f59e0b", letterSpacing: "1px", animation: "wspulse 1s ease infinite" }}>
            LOADING…
          </span>
        )}
      </div>

      {/* Waveform */}
      <div ref={containerRef} style={{ marginBottom: "10px", cursor: "pointer", opacity: isLoading ? 0.4 : 1, transition: "opacity 0.3s" }} />

      {/* Time row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {formatTime(currentTime)}
        </span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {formatTime(duration)}
        </span>
      </div>

      {error && (
        <p style={{ fontSize: "11px", color: "#ef4444", textAlign: "center", marginBottom: "12px" }}>{error}</p>
      )}

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        {/* Left: Loop */}
        <div style={{ flex: 1, display: "flex" }}>
          <button
            onClick={() => setIsLoop(p => !p)}
            title="Loop"
            style={{
              width: "34px", height: "34px", borderRadius: "50%", border: "none",
              background: isLoop ? "rgba(255,255,255,0.1)" : "transparent",
              color: isLoop ? "#d1d5db" : "#555",
              display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.18s",
            }}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Center: Skip back / Play / Skip forward */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => skip(-10)}
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: "none", background: "transparent", color: "#555", display: "grid", placeItems: "center", cursor: "pointer", transition: "color 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#bbb")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!isReady}
            style={{
              width: "52px", height: "52px", borderRadius: "50%", border: "none",
              background: "linear-gradient(180deg, #fff 0%, #e5e7eb 100%)",
              color: "#0b1020", display: "grid", placeItems: "center", cursor: isReady ? "pointer" : "default",
              opacity: isReady ? 1 : 0.45,
              boxShadow: isPlaying ? "0 0 24px rgba(99,102,241,0.35), 0 6px 20px rgba(0,0,0,0.3)" : "0 6px 20px rgba(0,0,0,0.3)",
              transition: "all 0.2s",
            }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: "2px" }} />}
          </button>

          <button
            onClick={() => skip(10)}
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: "none", background: "transparent", color: "#555", display: "grid", placeItems: "center", cursor: "pointer", transition: "color 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#bbb")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Right: Volume */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={() => setIsMuted(p => !p)}
            style={{ width: "28px", height: "28px", background: "transparent", border: "none", color: "#555", display: "grid", placeItems: "center", cursor: "pointer", transition: "color 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#bbb")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.3)", minWidth: "28px", textAlign: "center" }}>
            {displayVol}%
          </span>
          <input
            ref={volumeSliderRef}
            type="range" min={0} max={1} step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{
              width: "72px", height: "5px", appearance: "none", borderRadius: "999px", outline: "none", cursor: "pointer",
              background: `linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.55) var(--vol,0%), rgba(255,255,255,0.1) var(--vol,0%), rgba(255,255,255,0.1) 100%)`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      <style>{`
        @keyframes wsbar {
          0%   { height: 4px; }
          100% { height: 14px; }
        }
        @keyframes wspulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
