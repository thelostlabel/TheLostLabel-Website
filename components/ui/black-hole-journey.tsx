"use client";

import { useEffect, useRef } from "react";
import { IS_MOBILE } from "@/lib/is-mobile";

const TEXT         = "THE LOST LABEL★";
const LETTER_COUNT = TEXT.length;

// Perspective: 0.42 = ~45° overhead viewing angle
const PERSP_Y  = 0.42;

// Physics constants (all radii as fractions of min(w,h))
const MAX_R    = 0.60;   // spawn radius
const HOLE_R   = 0.19;   // event horizon radius
const FALL     = 0.00045; // radial infall per frame
const OMEGA_0  = 0.013;  // base angular speed at MAX_R (increases ~1/r toward center)
const ARM_COUNT = 3;     // spiral arms

const MAX_FONT = 0.072;  // font size factor at MAX_R

interface Particle {
  charIdx:   number;
  angle:     number;  // radians
  radius:    number;  // fraction of size
  fallRate:  number;  // slight variation per particle
}

function spawnParticles(): Particle[] {
  const ps: Particle[] = [];
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const armOffset = (arm / ARM_COUNT) * Math.PI * 2;
    for (let i = 0; i < LETTER_COUNT; i++) {
      const t = i / LETTER_COUNT;
      // letters spread from inner to outer along each arm (spiral shape)
      const r     = HOLE_R + (MAX_R - HOLE_R) * (1 - t * 0.85);
      // each successive letter further along the spiral
      const angle = armOffset - t * Math.PI * 1.6;
      ps.push({
        charIdx:  i,
        angle,
        radius:   r,
        fallRate: FALL * (0.88 + Math.random() * 0.24),
      });
    }
  }
  return ps;
}

export function BlackHoleJourney() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const psRef      = useRef<Particle[]>(spawnParticles());
  const seqRef     = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, size = 0;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      size = Math.min(w, h);
      canvas.width  = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const respawn = (p: Particle) => {
      p.charIdx  = seqRef.current % LETTER_COUNT;
      seqRef.current++;
      p.radius   = MAX_R * (0.92 + Math.random() * 0.14);
      // spread new arrivals around the outer edge
      p.angle    = Math.random() * Math.PI * 2;
      p.fallRate = FALL * (0.88 + Math.random() * 0.24);
    };

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const cx  = w / 2;
      const cy  = h / 2;
      const mob = IS_MOBILE;
      const sc  = mob ? 0.80 : 1.0;   // mobile scale

      const maxR_px  = MAX_R  * size * sc;
      const holeR_px = HOLE_R * size * sc;

      // ── Background ──────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      const ps = psRef.current;

      // ── Physics update ───────────────────────────────────────────
      for (const p of ps) {
        const r_px = p.radius * size * sc;
        // angular velocity ∝ 1/r  (faster near center)
        const omega = OMEGA_0 * (maxR_px / r_px);
        p.angle  += omega;
        p.radius -= p.fallRate;

        if (p.radius * size * sc <= holeR_px * 1.05) {
          respawn(p);
        }
      }

      // ── Sort back-to-front for correct depth overlap ─────────────
      const drawList = [...ps].sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));

      // ── Draw letters ─────────────────────────────────────────────
      for (const p of drawList) {
        const r_px = p.radius * size * sc;

        // Skip if inside hole (safety)
        if (r_px <= holeR_px) continue;

        // Screen position (perspective ellipse)
        const sx = cx + r_px * Math.cos(p.angle);
        const sy = cy + r_px * Math.sin(p.angle) * PERSP_Y;

        // Letter rotation: tangent of the perspective ellipse
        const rot = Math.atan2(Math.cos(p.angle) * PERSP_Y, -Math.sin(p.angle));

        // Scale: proportional to radius — big outside, tiny near center
        const t       = Math.max(0, (r_px - holeR_px) / (maxR_px - holeR_px));
        const scale   = 0.18 + 0.82 * t;
        const fontSize = Math.max(6, Math.round(MAX_FONT * size * sc * scale));

        // Opacity: full until 20% from hole, then fade to 0
        const opacity = Math.min(1, t / 0.22);

        // Depth dimming (far = dimmer)
        const depth  = (Math.sin(p.angle) + 1) / 2;    // 0 (far) … 1 (near)
        const dimmed = 0.45 + 0.55 * depth;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rot);
        ctx.font        = `900 ${fontSize}px "Arial Black", "Arial", Impact, sans-serif`;
        ctx.textAlign   = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = opacity * dimmed;
        ctx.fillStyle   = "#ffffff";
        ctx.fillText(TEXT[p.charIdx], 0, 0);
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      // ── Black hole ───────────────────────────────────────────────
      // Outer glow halo
      const glow = ctx.createRadialGradient(cx, cy, holeR_px * 0.88, cx, cy, holeR_px * 2.0);
      glow.addColorStop(0,   "rgba(255,255,255,0.06)");
      glow.addColorStop(0.4, "rgba(255,255,255,0.014)");
      glow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, holeR_px * 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Pure black disc
      ctx.beginPath();
      ctx.arc(cx, cy, holeR_px, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      // Thin event-horizon ring
      ctx.beginPath();
      ctx.arc(cx, cy, holeR_px + 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    };

    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
