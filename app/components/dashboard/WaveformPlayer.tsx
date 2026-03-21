"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPct = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = src;
    audio.load();

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = 0;
    } else {
      audio.volume = volume ** 2;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = isLoop;
  }, [isLoop]);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isPlaying]);

  // CSS variable for volume slider fill
  useEffect(() => {
    if (volumeSliderRef.current) {
      const pct = isMuted ? 0 : Math.round(volume * 100);
      volumeSliderRef.current.style.setProperty("--vol", `${pct}%`);
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setError("Audio file could not be loaded.");
    }
  }, [isReady]);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Math.max(0, Math.min(audio.currentTime + delta, duration || audio.duration || 0));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const displayVol = isMuted ? 0 : Math.round(volume * 100);

  const handleSeek = useCallback((clientX: number) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress || !duration) return;

    const rect = progress.getBoundingClientRect();
    if (!rect.width) return;

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nextTime = ratio * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

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
        {(isLoading || isBuffering) && (
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#f59e0b", letterSpacing: "1px", animation: "wspulse 1s ease infinite" }}>
            {isBuffering ? "BUFFERING…" : "LOADING…"}
          </span>
        )}
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          const nextDuration = audio?.duration;
          if (nextDuration && Number.isFinite(nextDuration)) {
            setDuration(nextDuration);
          }
          setIsReady(true);
          setIsLoading(false);
          setError(null);
        }}
        onDurationChange={() => {
          const audio = audioRef.current;
          const nextDuration = audio?.duration;
          if (nextDuration && Number.isFinite(nextDuration)) {
            setDuration(nextDuration);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => {
          setIsReady(true);
          setIsLoading(false);
          setIsBuffering(false);
        }}
        onCanPlayThrough={() => {
          setIsReady(true);
          setIsLoading(false);
          setIsBuffering(false);
        }}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio) {
            setCurrentTime(audio.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(isLoop ? currentTime : 0);
        }}
        onError={() => {
          setError("Audio file could not be loaded.");
          setIsLoading(false);
          setIsBuffering(false);
          setIsReady(false);
        }}
      />

      {/* Waveform */}
      <div
        ref={progressRef}
        onClick={(e) => handleSeek(e.clientX)}
        style={{
          marginBottom: "10px",
          cursor: isReady ? "pointer" : "default",
          opacity: isLoading ? 0.4 : 1,
          transition: "opacity 0.3s",
          height: "64px",
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          padding: "4px 0",
        }}
      >
        {Array.from({ length: 48 }).map((_, index) => {
          const normalizedIndex = index / 47;
          const active = normalizedIndex <= progressPct / 100;
          const height = 18 + Math.round((Math.sin(index * 0.7) + 1) * 16);

          return (
            <div
              key={index}
              style={{
                flex: 1,
                minWidth: "2px",
                height: `${height}px`,
                borderRadius: "999px",
                background: active ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.12)",
                transition: "background 0.18s ease",
              }}
            />
          );
        })}
      </div>

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
