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
  waveformUrl?: string;
  filename?: string;
}

interface WaveformResponse {
  duration: number;
  peaks: Array<number[]>;
}

export default function WaveformPlayer({ src, waveformUrl, filename }: WaveformPlayerProps) {
  return <WaveformPlayerInner key={src} src={src} waveformUrl={waveformUrl} filename={filename} />;
}

function WaveformPlayerInner({ src, waveformUrl, filename }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);
  const loopRef = useRef(false);

  const [waveformData, setWaveformData] = useState<WaveformResponse | null>(null);
  const [waveformFetchFailed, setWaveformFetchFailed] = useState(() => !waveformUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    if (!waveformUrl) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    fetch(waveformUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: WaveformResponse) => {
        if (cancelled) return;
        if (!Array.isArray(data?.peaks) || typeof data?.duration !== "number") {
          throw new Error("Invalid waveform payload");
        }
        setWaveformData(data);
      })
      .catch((fetchError) => {
        if (cancelled || fetchError?.name === "AbortError") return;
        setWaveformFetchFailed(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [waveformUrl]);

  useEffect(() => {
    volumeRef.current = volume;
    mutedRef.current = isMuted;

    const ws = wsRef.current;
    if (!ws) return;
    ws.setVolume(isMuted ? 0 : volume ** 2);
  }, [volume, isMuted]);

  useEffect(() => {
    loopRef.current = isLoop;
  }, [isLoop]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!waveformData && waveformUrl && !waveformFetchFailed) return;

    // Read theme CSS vars for WaveSurfer (can't accept CSS vars natively)
    const style = getComputedStyle(document.documentElement);
    const waveColor = style.getPropertyValue("--ds-text-faint").trim() || "rgba(255,255,255,0.28)";
    const progressColor = style.getPropertyValue("--ds-text-sub").trim() || "rgba(255,255,255,0.70)";
    const cursorColor = style.getPropertyValue("--ds-text").trim() || "#ffffff";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 64,
      normalize: true,
      interact: true,
      backend: "MediaElement",
    });

    wsRef.current = ws;

    ws.on("loading", () => setIsLoading(true));
    ws.on("ready", (nextDuration) => {
      setDuration(nextDuration);
      setCurrentTime(0);
      setIsLoading(false);
      setIsReady(true);
      setError(null);
      ws.setVolume(mutedRef.current ? 0 : volumeRef.current ** 2);
    });
    ws.on("audioprocess", (time) => setCurrentTime(time));
    ws.on("timeupdate", (time) => setCurrentTime(time));
    ws.on("seeking", (time) => setCurrentTime(time));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => {
      setIsPlaying(false);
      if (loopRef.current) {
        void ws.play();
        return;
      }
      setCurrentTime(0);
    });
    ws.on("error", () => {
      setError("Audio file could not be loaded.");
      setIsLoading(false);
      setIsReady(false);
    });

    const loadPromise = waveformData
      ? ws.load(src, waveformData.peaks, waveformData.duration)
      : ws.load(src);

    loadPromise.catch(() => {
      setError("Audio file could not be loaded.");
      setIsLoading(false);
      setIsReady(false);
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [src, waveformData, waveformFetchFailed, waveformUrl]);

  // CSS variable for volume slider fill
  useEffect(() => {
    if (volumeSliderRef.current) {
      const pct = isMuted ? 0 : Math.round(volume * 100);
      volumeSliderRef.current.style.setProperty("--vol", `${pct}%`);
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(async () => {
    const ws = wsRef.current;
    if (!ws || !isReady) return;
    try {
      await ws.playPause();
    } catch {
      setError("Audio file could not be loaded.");
    }
  }, [isReady]);

  const skip = useCallback((delta: number) => {
    const ws = wsRef.current;
    if (!ws) return;
    const nextTime = Math.max(0, Math.min(ws.getCurrentTime() + delta, duration));
    ws.setTime(nextTime);
    setCurrentTime(nextTime);
  }, [duration]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const displayVol = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div className="wfp-root">
      {/* Track name row */}
      <div className="wfp-header">
        <div className="wfp-bars" aria-hidden>
          {[0, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
            <div
              key={i}
              className={`wfp-bar${isPlaying ? " wfp-bar--playing" : ""}`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <span className="wfp-filename ds-text">
          {filename?.toUpperCase() ?? "UNKNOWN TRACK"}
        </span>
        {isLoading && (
          <span className="wfp-loading-label">LOADING…</span>
        )}
      </div>

      {/* Waveform */}
      <div
        ref={containerRef}
        className="wfp-waveform"
        style={{ cursor: isReady ? "pointer" : "default", opacity: isLoading ? 0.4 : 1 }}
      />

      {/* Time row */}
      <div className="wfp-time-row">
        <span className="wfp-time ds-text-muted">{formatTime(currentTime)}</span>
        <span className="wfp-time ds-text-faint">{formatTime(duration)}</span>
      </div>

      {error && (
        <p className="wfp-error">{error}</p>
      )}

      {/* Controls */}
      <div className="wfp-controls">
        {/* Loop */}
        <div className="wfp-controls-side">
          <button
            onClick={() => setIsLoop(p => !p)}
            title="Loop"
            className={`wfp-icon-btn${isLoop ? " wfp-icon-btn--active" : ""}`}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Skip / Play */}
        <div className="wfp-playrow">
          <button
            onClick={() => skip(-10)}
            className="wfp-icon-btn"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!isReady}
            className={`wfp-play-btn${isPlaying ? " wfp-play-btn--playing" : ""}`}
            style={{ opacity: isReady ? 1 : 0.45 }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="wfp-play-icon" />}
          </button>

          <button
            onClick={() => skip(10)}
            className="wfp-icon-btn"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Volume */}
        <div className="wfp-volume">
          <button
            onClick={() => setIsMuted(p => !p)}
            className="wfp-icon-btn wfp-vol-btn"
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <span className="wfp-vol-pct ds-text-faint">{displayVol}%</span>
          <input
            ref={volumeSliderRef}
            type="range" min={0} max={1} step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="wfp-vol-slider"
          />
        </div>
      </div>

      <style>{`
        .wfp-root {
          background: linear-gradient(180deg, var(--ds-glass-bg) 0%, var(--ds-item-bg) 100%);
          border: 1px solid var(--ds-glass-border);
          border-radius: 16px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 24px var(--ds-glass-shadow), inset 0 1px 0 var(--ds-glass-inset);
        }

        .wfp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .wfp-bars {
          display: flex;
          gap: 2px;
          align-items: flex-end;
          height: 14px;
          flex-shrink: 0;
        }

        .wfp-bar {
          width: 3px;
          height: 4px;
          border-radius: 1px;
          background: var(--ds-item-border-hover);
          animation: none;
        }

        .wfp-bar--playing {
          background: var(--ds-text-muted);
          animation: wsbar 0.8s ease-in-out infinite alternate;
        }

        .wfp-filename {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .wfp-loading-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--color-warning, #f59e0b);
          letter-spacing: 1px;
          animation: wspulse 1s ease infinite;
          flex-shrink: 0;
        }

        .wfp-waveform {
          margin-bottom: 10px;
          transition: opacity 0.3s;
          min-height: 68px;
          padding: 2px 0;
        }

        .wfp-time-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .wfp-time {
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .wfp-error {
          font-size: 11px;
          color: var(--color-danger, #ef4444);
          text-align: center;
          margin-bottom: 12px;
        }

        .wfp-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }

        .wfp-controls-side {
          flex: 1;
          display: flex;
        }

        .wfp-playrow {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .wfp-volume {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
          min-width: 0;
        }

        .wfp-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--ds-text-faint);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 0.18s, background 0.18s;
        }

        .wfp-icon-btn:hover {
          color: var(--ds-text-sub);
        }

        .wfp-icon-btn--active {
          background: var(--ds-item-bg-hover);
          color: var(--ds-text-sub);
        }

        .wfp-vol-btn {
          width: 28px;
          height: 28px;
        }

        .wfp-play-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1px solid var(--ds-glass-border);
          background: var(--ds-text);
          color: var(--background);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 6px 20px var(--ds-glass-shadow);
          transition: box-shadow 0.2s, opacity 0.2s;
        }

        .wfp-play-btn--playing {
          box-shadow: 0 0 0 3px var(--ds-item-border-hover), 0 6px 20px var(--ds-glass-shadow);
        }

        .wfp-play-btn:disabled {
          cursor: default;
        }

        .wfp-play-icon {
          margin-left: 2px;
        }

        .wfp-vol-pct {
          font-size: 9px;
          font-weight: 600;
          min-width: 28px;
          text-align: center;
        }

        .wfp-vol-slider {
          width: 72px;
          height: 5px;
          appearance: none;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            90deg,
            var(--ds-text-sub) 0%,
            var(--ds-text-sub) var(--vol, 0%),
            var(--ds-item-border-hover) var(--vol, 0%),
            var(--ds-item-border-hover) 100%
          );
        }

        .wfp-vol-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--ds-text);
          cursor: pointer;
        }

        @keyframes wsbar {
          0%   { height: 4px; }
          100% { height: 14px; }
        }
        @keyframes wspulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        @media (max-width: 720px) {
          .wfp-root {
            padding: 16px;
          }

          .wfp-header {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .wfp-filename {
            width: 100%;
            white-space: normal;
            line-height: 1.4;
          }

          .wfp-controls {
            flex-wrap: wrap;
            justify-content: center;
          }

          .wfp-controls-side,
          .wfp-volume {
            flex: 1 1 100%;
            justify-content: center;
          }

          .wfp-playrow {
            order: -1;
          }
        }

        @media (max-width: 420px) {
          .wfp-play-btn {
            width: 48px;
            height: 48px;
          }

          .wfp-icon-btn {
            width: 32px;
            height: 32px;
          }

          .wfp-vol-slider {
            width: 88px;
          }
        }
      `}</style>
    </div>
  );
}
