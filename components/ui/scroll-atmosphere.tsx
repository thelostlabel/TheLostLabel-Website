// components/ui/scroll-atmosphere.tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ScrollAtmosphere — fixed overlay layers that add cinematic grain and vignette
 * effects whose intensity shifts with the scroll position.
 *
 * Renders two pointer-events-none overlays:
 *  1. Animated SVG noise grain (opacity driven by ScrollTrigger)
 *  2. Radial-gradient vignette (spread + opacity driven by ScrollTrigger)
 */
export function ScrollAtmosphere() {
  const grainRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const grainEl = grainRef.current;
    const vignetteEl = vignetteRef.current;
    if (!grainEl || !vignetteEl) return;

    // ── Animated grain seed (shift SVG turbulence seed every ~100ms) ──
    let lastSeedTime = 0;
    const SEED_INTERVAL = 100;

    function animateGrainSeed(time: number) {
      if (prefersReducedMotion) return;
      if (time - lastSeedTime >= SEED_INTERVAL) {
        lastSeedTime = time;
        seedRef.current = (seedRef.current + 1) % 10;
        const svg = grainEl!.querySelector("svg");
        const turb = svg?.querySelector("feTurbulence");
        if (turb) {
          turb.setAttribute("seed", String(seedRef.current));
        }
      }
      rafRef.current = requestAnimationFrame(animateGrainSeed);
    }

    rafRef.current = requestAnimationFrame(animateGrainSeed);

    // ── GSAP context ──
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(grainEl, { opacity: 0.04 });
      gsap.set(vignetteEl, {
        opacity: 0.5,
        "--vignette-spread": "70%",
      } as gsap.TweenVars);

      // We create a single scroll-driven timeline across the full page height.
      // The page flows: Hero (pinned ~2200px) → Releases → Stats → CTA
      // We use document-level scrub so positions are relative to total scroll.

      // ── Hero section grain & vignette (already at defaults) ──
      // During hero pin the values stay at baseline.

      // ── Releases section ──
      // Increase grain during the transition *into* releases, then settle.
      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress; // 0 → 1 across full page

          // Map scroll progress to grain opacity and vignette intensity.
          // These breakpoints are approximate for a 4-section page.
          let grainOpacity: number;
          let vignetteOpacity: number;
          let vignetteSpread: string;

          if (p < 0.15) {
            // Hero region
            grainOpacity = 0.04;
            vignetteOpacity = 0.5;
            vignetteSpread = "70%";
          } else if (p < 0.25) {
            // Transition: Hero → Releases
            const t = (p - 0.15) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.04, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.5, 0.75, t);
            vignetteSpread = `${gsap.utils.interpolate(70, 55, t)}%`;
          } else if (p < 0.45) {
            // Releases section
            const t = (p - 0.25) / 0.2;
            grainOpacity = gsap.utils.interpolate(0.08, 0.05, t);
            vignetteOpacity = gsap.utils.interpolate(0.75, 0.55, t);
            vignetteSpread = `${gsap.utils.interpolate(55, 65, t)}%`;
          } else if (p < 0.55) {
            // Transition: Releases → Stats
            const t = (p - 0.45) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.05, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.55, 0.7, t);
            vignetteSpread = `${gsap.utils.interpolate(65, 56, t)}%`;
          } else if (p < 0.7) {
            // Stats section (clean)
            const t = (p - 0.55) / 0.15;
            grainOpacity = gsap.utils.interpolate(0.08, 0.03, t);
            vignetteOpacity = gsap.utils.interpolate(0.7, 0.4, t);
            vignetteSpread = `${gsap.utils.interpolate(56, 72, t)}%`;
          } else if (p < 0.8) {
            // Transition: Stats → CTA
            const t = (p - 0.7) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.03, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.4, 0.8, t);
            vignetteSpread = `${gsap.utils.interpolate(72, 50, t)}%`;
          } else {
            // CTA section (cinematic)
            const t = (p - 0.8) / 0.2;
            grainOpacity = gsap.utils.interpolate(0.08, 0.06, t);
            vignetteOpacity = gsap.utils.interpolate(0.8, 0.85, t);
            vignetteSpread = `${gsap.utils.interpolate(50, 45, t)}%`;
          }

          gsap.set(grainEl, { opacity: grainOpacity });
          vignetteEl!.style.opacity = String(vignetteOpacity);
          vignetteEl!.style.setProperty("--vignette-spread", vignetteSpread);
        },
      });
    });

    return () => {
      ctx.revert();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Grain overlay ── */}
      <div
        ref={grainRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998, mixBlendMode: "overlay" }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-full"
        >
          <filter id="atmosphereNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
              seed="0"
            />
          </filter>
          <rect
            width="100%"
            height="100%"
            filter="url(#atmosphereNoise)"
          />
        </svg>
      </div>

      {/* ── Vignette overlay ── */}
      <div
        ref={vignetteRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9997,
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent var(--vignette-spread, 70%), rgba(0,0,0,0.9) 100%)",
        }}
      />
    </>
  );
}
