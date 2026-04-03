"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerAccentProps {
  className?: string;
  barCount?: number;
  color?: string;
}

export function AudioVisualizerAccent({
  className = "",
  barCount = 24,
  color = "rgba(255,255,255,0.3)",
}: AudioVisualizerAccentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = () => motionQuery.matches;

    const barWidth = 2.5;
    const gap = 3.5;
    const maxHeight = 40;
    const totalWidth = barCount * (barWidth + gap) - gap;
    const canvasHeight = maxHeight + 4; // small padding

    // Set canvas size (2x for retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Pre-compute per-bar parameters for organic movement
    const bars = Array.from({ length: barCount }, (_, i) => ({
      freq1: 0.8 + Math.sin(i * 1.3) * 0.4,
      freq2: 0.5 + Math.cos(i * 0.7) * 0.3,
      freq3: 0.3 + Math.sin(i * 2.1) * 0.15,
      phase1: (i / barCount) * Math.PI * 2 + i * 0.4,
      phase2: (i / barCount) * Math.PI * 1.3 + i * 0.7,
      phase3: (i / barCount) * Math.PI * 0.8 + i * 1.1,
      baseHeight: 0.15 + Math.sin(i * 0.5) * 0.05,
    }));

    // Parse color to extract RGB for opacity variation
    const parseColor = (c: string) => {
      // If rgba, extract components
      const rgbaMatch = c.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
      );
      if (rgbaMatch) {
        return {
          r: parseInt(rgbaMatch[1]),
          g: parseInt(rgbaMatch[2]),
          b: parseInt(rgbaMatch[3]),
          a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
        };
      }
      return { r: 255, g: 255, b: 255, a: 0.3 };
    };

    const parsed = parseColor(color);

    let startTime: number | null = null;

    const draw = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      ctx.clearRect(0, 0, totalWidth, canvasHeight);

      for (let i = 0; i < barCount; i++) {
        const bar = bars[i];
        let heightNorm: number;

        if (prefersReducedMotion()) {
          // Static gentle curve for reduced motion
          heightNorm =
            bar.baseHeight +
            0.15 * Math.sin((i / barCount) * Math.PI);
        } else {
          // Layered sine waves for organic pulsing
          const wave1 =
            Math.sin(elapsed * bar.freq1 + bar.phase1) * 0.35;
          const wave2 =
            Math.sin(elapsed * bar.freq2 + bar.phase2) * 0.2;
          const wave3 =
            Math.sin(elapsed * bar.freq3 + bar.phase3) * 0.1;
          // Gentle global pulse
          const globalPulse = Math.sin(elapsed * 0.4) * 0.05;

          heightNorm =
            bar.baseHeight + wave1 + wave2 + wave3 + globalPulse;
        }

        // Clamp between a minimum and 1
        heightNorm = Math.max(0.05, Math.min(1, (heightNorm + 1) / 2));

        const h = heightNorm * maxHeight;
        const x = i * (barWidth + gap);
        const y = canvasHeight - h;

        // Vary opacity slightly per bar based on height
        const opacity = parsed.a * (0.5 + heightNorm * 0.5);
        ctx.fillStyle = `rgba(${parsed.r},${parsed.g},${parsed.b},${opacity})`;

        // Rounded rect for softer look
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + h - radius);
        ctx.quadraticCurveTo(
          x + barWidth,
          y + h,
          x + barWidth - radius,
          y + h
        );
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
}
