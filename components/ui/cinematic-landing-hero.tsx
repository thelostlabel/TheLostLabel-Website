// components/ui/cinematic-landing-hero.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { HandwrittenLogo } from "@/components/ui/handwritten-logo";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
  @media (max-width: 768px) {
    .film-grain { display: none; }
  }

  .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

.text-3d-matte {
    color: var(--color-foreground);
    text-shadow: 0 10px 30px color-mix(in srgb, var(--color-foreground) 20%, transparent),
                 0 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent);
  }
  .text-silver-matte {
    background: linear-gradient(180deg, var(--color-foreground) 0%, color-mix(in srgb, var(--color-foreground) 40%, transparent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0px 10px 20px color-mix(in srgb, var(--color-foreground) 15%, transparent))
            drop-shadow(0px 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent));
  }

`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
}

export function CinematicHero({
  brandName = "LOST.",
  tagline1 = "Submit your demo,",
  tagline2 = "start your journey.",
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", {
        autoAlpha: 0,
        y: 60,
        scale: 0.85,
        filter: "blur(20px)",
        rotationX: -20,
      });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", {
          duration: 1.8,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          rotationX: 0,
          ease: "expo.out",
        })
        .to(".text-days", {
          duration: 1.4,
          clipPath: "inset(0 0% 0 0)",
          ease: "power4.inOut",
        }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: prefersReducedMotion ? "+=1600" : "+=2200",
          pin: true,
          scrub: prefersReducedMotion ? 0.25 : 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], {
          scale: 1.05,
          filter: "blur(10px)",
          opacity: 0.3,
          ease: "power2.inOut",
          duration: prefersReducedMotion ? 0.8 : 1.2,
        }, 0)
        .to([".hero-text-wrapper", ".bg-grid-theme"], {
          scale: 1.1,
          filter: "blur(24px)",
          opacity: 0,
          ease: "power2.in",
          duration: prefersReducedMotion ? 0.6 : 0.8,
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <FloatingParticles className="absolute inset-0 z-[5]" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      <div className="hero-text-wrapper absolute inset-0 z-10 flex isolate items-center justify-center text-center px-4 will-change-transform">
        <div className="relative z-20 flex flex-col items-center gap-3 md:gap-4">
          <div className="w-[80vw] max-w-[700px]">
            <HandwrittenLogo
              text="The Lost Company"
              animate={false}
              color="var(--color-foreground, #ffffff)"
              font="bofly"
            />
          </div>
          <h1 className="text-track gsap-reveal text-3d-matte text-3xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight">
            {tagline1}
          </h1>
          <h1 className="text-days gsap-reveal text-silver-matte text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tighter">
            {tagline2}
          </h1>

        </div>
      </div>
    </div>
  );
}
