"use client";

import { useEffect, useRef } from "react";
import { IS_MOBILE } from "@/lib/is-mobile";

interface DiskParticle {
  angle: number;     // current orbital angle (0..2π)
  orbitA: number;    // semi-major axis (horizontal radius on screen)
  angularV: number;  // angular velocity (rad/frame) — inner faster (Keplerian)
  brightness: number;
  colorTemp: number; // 0=cool red, 1=hot white
}

// Map particle state → RGBA string
function particleColor(colorTemp: number, dopplerFactor: number, alpha: number): string {
  const t = colorTemp * (0.55 + dopplerFactor * 0.45);
  let r: number, g: number, b: number;
  if (t > 0.72) {
    // White-hot core
    const k = (t - 0.72) / 0.28;
    r = 255; g = Math.round(220 + k * 35); b = Math.round(150 + k * 105);
  } else if (t > 0.38) {
    // Orange → yellow
    const k = (t - 0.38) / 0.34;
    r = 255; g = Math.round(80 + k * 140); b = Math.round(k * 20);
  } else {
    // Dark red → orange
    const k = t / 0.38;
    r = Math.round(120 + k * 135); g = Math.round(k * 80); b = 0;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

export function GravitationalHero({
  tagline = "found in the dark.",
}: {
  brandName?: string;
  tagline?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Constants ────────────────────────────────────────────────────────
    const SHADOW      = IS_MOBILE ? 68 : 105;   // black circle radius
    const DISK_RATIO  = 0.28;                    // b/a — nearly edge-on
    const DISK_TILT   = -0.14;                   // clockwise tilt (radians)
    const COUNT       = IS_MOBILE ? 280 : 650;
    const TRAIL       = IS_MOBILE ? 0.16 : 0.11; // lower = longer flowing trails
    // Angular velocity reference: inner orbit at 1.1×SHADOW does 1 rev in ~6s
    const REF_OMEGA   = (Math.PI * 2) / (60 * 6);
    const REF_A       = SHADOW * 1.1;

    let w = 0;
    let h = 0;
    let particles: DiskParticle[] = [];

    function makeDiskParticle(): DiskParticle {
      const minA      = SHADOW * 1.02;
      const maxA      = SHADOW * 2.9;
      const orbitA    = minA + Math.pow(Math.random(), 1.4) * (maxA - minA);
      // Keplerian: ω ∝ r^(-3/2)
      const angularV  = REF_OMEGA * Math.pow(REF_A / orbitA, 1.5);
      const norm      = (orbitA - minA) / (maxA - minA); // 0=inner 1=outer
      return {
        angle:      Math.random() * Math.PI * 2,
        orbitA,
        angularV,
        brightness: Math.max(0.25, 1 - norm * 0.65),
        colorTemp:  Math.max(0.05, 1 - norm * 0.85),
      };
    }

    // Project disk angle+radius → screen xy + depth z
    function project(angle: number, a: number): { x: number; y: number; z: number } {
      const ex = a * Math.cos(angle);
      const ey = a * Math.sin(angle) * DISK_RATIO;
      // Apply disk tilt rotation
      const rx = ex * Math.cos(DISK_TILT) - ey * Math.sin(DISK_TILT);
      const ry = ex * Math.sin(DISK_TILT) + ey * Math.cos(DISK_TILT);
      // z > 0 → in front of shadow (near side of disk)
      const z  = -Math.sin(angle);
      return { x: w / 2 + rx, y: h / 2 + ry, z };
    }

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width  = w;
      canvas.height = h;
      particles = Array.from({ length: COUNT }, makeDiskParticle);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const cx = w / 2;
      const cy = h / 2;

      // Trail — low alpha fill creates long flowing light streaks
      ctx.fillStyle = `rgba(5,5,5,${TRAIL})`;
      ctx.fillRect(0, 0, w, h);

      // Subtle background heat glow
      const heat = ctx.createRadialGradient(cx, cy, SHADOW, cx, cy, SHADOW * 3.2);
      heat.addColorStop(0,   "rgba(160,45,0,0.045)");
      heat.addColorStop(0.5, "rgba(100,20,0,0.02)");
      heat.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = heat;
      ctx.fillRect(0, 0, w, h);

      // ── Draw "back" particles (z < 0) first — they go under the shadow ─
      for (const p of particles) {
        const pos = project(p.angle, p.orbitA);
        if (pos.z >= 0) continue; // skip front-side

        const doppler = 0.5 + 0.5 * Math.cos(p.angle + Math.PI * 0.75);
        const alpha   = p.brightness * (0.3 + doppler * 0.5);
        const size    = p.colorTemp > 0.55 ? 1.1 : 0.65;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(p.colorTemp, doppler, Math.min(0.9, alpha));
        ctx.fill();
      }

      // ── Shadow (hides back particles that overlap with center) ──────────
      const shadowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, SHADOW + 18);
      shadowGrad.addColorStop(0,    "rgba(5,5,5,1)");
      shadowGrad.addColorStop(0.84, "rgba(5,5,5,1)");
      shadowGrad.addColorStop(0.93, "rgba(18,4,0,0.6)"); // warm edge tinge
      shadowGrad.addColorStop(1,    "rgba(5,5,5,0)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Draw "front" particles (z ≥ 0) — they appear over the shadow ───
      for (const p of particles) {
        const pos = project(p.angle, p.orbitA);
        if (pos.z < 0) continue;

        const doppler = 0.5 + 0.5 * Math.cos(p.angle + Math.PI * 0.75);
        const alpha   = p.brightness * (0.35 + doppler * 0.55);
        const size    = p.colorTemp > 0.55 ? 1.2 : 0.7;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(p.colorTemp, doppler, Math.min(0.95, alpha));
        ctx.fill();
      }

      // ── Photon ring — thin arc just outside shadow ───────────────────────
      // Left side (Doppler-bright, approaching material) is warmer/brighter
      const ringGrad = ctx.createLinearGradient(cx - SHADOW, cy, cx + SHADOW, cy);
      ringGrad.addColorStop(0,   "rgba(255,160,30,0.30)");
      ringGrad.addColorStop(0.3, "rgba(255,110,10,0.15)");
      ringGrad.addColorStop(0.6, "rgba(200,55,0,0.08)");
      ringGrad.addColorStop(1,   "rgba(180,40,0,0.18)");

      ctx.beginPath();
      ctx.arc(cx, cy, SHADOW + 5, 0, Math.PI * 2);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = IS_MOBILE ? 2 : 3;
      ctx.stroke();

      // ── Lensed upper arc — gravitationally bent back-disk light ─────────
      // Appears as thin bright crescent above the shadow (like Interstellar)
      const lensGrad = ctx.createLinearGradient(cx - SHADOW, cy, cx + SHADOW, cy);
      lensGrad.addColorStop(0,   "rgba(255,180,60,0.22)");
      lensGrad.addColorStop(0.35,"rgba(255,120,20,0.10)");
      lensGrad.addColorStop(0.65,"rgba(180,50,0,0.06)");
      lensGrad.addColorStop(1,   "rgba(200,70,10,0.14)");

      ctx.beginPath();
      ctx.arc(cx, cy, SHADOW + 8, Math.PI + 0.25, -0.25); // top arc only
      ctx.strokeStyle = lensGrad;
      ctx.lineWidth = IS_MOBILE ? 1.5 : 2.5;
      ctx.stroke();

      // ── Final shadow re-paint to keep center crisp ───────────────────────
      const finalShadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, SHADOW + 2);
      finalShadow.addColorStop(0,   "rgba(5,5,5,1)");
      finalShadow.addColorStop(0.92,"rgba(5,5,5,1)");
      finalShadow.addColorStop(1,   "rgba(5,5,5,0)");
      ctx.fillStyle = finalShadow;
      ctx.fillRect(0, 0, w, h);

      // ── Advance all particle angles ──────────────────────────────────────
      for (const p of particles) {
        p.angle = (p.angle + p.angularV) % (Math.PI * 2);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505] flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <p
        style={{
          position: "absolute",
          bottom: "8vh",
          zIndex: 10,
          fontSize: "clamp(0.55rem, 1.1vw, 0.7rem)",
          color: "rgba(255,255,255,0.12)",
          letterSpacing: "0.45em",
          textTransform: "lowercase",
          fontWeight: 500,
          fontFamily: "var(--font-space-grotesk), sans-serif",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {tagline}
      </p>

      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-20"
        style={{ background: "linear-gradient(to top, #050505, transparent)" }}
      />
    </div>
  );
}
