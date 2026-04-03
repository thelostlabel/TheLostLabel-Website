// components/ui/scroll-atmosphere.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IS_MOBILE } from "@/lib/is-mobile";

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
  // Skip entirely on mobile — SVG feTurbulence + scroll-driven opacity is too heavy
  if (IS_MOBILE) return null;

  return <ScrollAtmosphereInner />;
}

function ScrollAtmosphereInner() {
  const grainRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grainEl = grainRef.current;
    const vignetteEl = vignetteRef.current;
    if (!grainEl || !vignetteEl) return;

    const ctx = gsap.context(() => {
      gsap.set(grainEl, { opacity: 0.04 });
      gsap.set(vignetteEl, {
        opacity: 0.5,
        "--vignette-spread": "70%",
      } as gsap.TweenVars);

      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;

          let grainOpacity: number;
          let vignetteOpacity: number;
          let vignetteSpread: string;

          if (p < 0.15) {
            grainOpacity = 0.04;
            vignetteOpacity = 0.5;
            vignetteSpread = "70%";
          } else if (p < 0.25) {
            const t = (p - 0.15) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.04, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.5, 0.75, t);
            vignetteSpread = `${gsap.utils.interpolate(70, 55, t)}%`;
          } else if (p < 0.45) {
            const t = (p - 0.25) / 0.2;
            grainOpacity = gsap.utils.interpolate(0.08, 0.05, t);
            vignetteOpacity = gsap.utils.interpolate(0.75, 0.55, t);
            vignetteSpread = `${gsap.utils.interpolate(55, 65, t)}%`;
          } else if (p < 0.55) {
            const t = (p - 0.45) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.05, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.55, 0.7, t);
            vignetteSpread = `${gsap.utils.interpolate(65, 56, t)}%`;
          } else if (p < 0.7) {
            const t = (p - 0.55) / 0.15;
            grainOpacity = gsap.utils.interpolate(0.08, 0.03, t);
            vignetteOpacity = gsap.utils.interpolate(0.7, 0.4, t);
            vignetteSpread = `${gsap.utils.interpolate(56, 72, t)}%`;
          } else if (p < 0.8) {
            const t = (p - 0.7) / 0.1;
            grainOpacity = gsap.utils.interpolate(0.03, 0.08, t);
            vignetteOpacity = gsap.utils.interpolate(0.4, 0.8, t);
            vignetteSpread = `${gsap.utils.interpolate(72, 50, t)}%`;
          } else {
            const t = (p - 0.8) / 0.2;
            grainOpacity = gsap.utils.interpolate(0.08, 0.06, t);
            vignetteOpacity = gsap.utils.interpolate(0.8, 0.85, t);
            vignetteSpread = `${gsap.utils.interpolate(50, 45, t)}%`;
          }

          grainEl!.style.opacity = String(grainOpacity);
          vignetteEl!.style.opacity = String(vignetteOpacity);
          vignetteEl!.style.setProperty("--vignette-spread", vignetteSpread);
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
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
