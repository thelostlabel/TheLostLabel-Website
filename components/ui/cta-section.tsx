// components/ui/cta-section.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, LogIn } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { IS_MOBILE } from "@/lib/is-mobile";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
  .lc-btn-primary {
    background: #FFFFFF;
    color: #0A0A0A;
    border: none;
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow:
      0 1px 2px rgba(0,0,0,0.12),
      0 8px 24px -4px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,1);
  }
  .lc-btn-primary:hover {
    background: #F0F0F0;
    transform: translateY(-2px);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.08),
      0 16px 32px -6px rgba(0,0,0,0.45),
      inset 0 1px 0 rgba(255,255,255,1);
  }
  .lc-btn-primary:active { transform: translateY(0); }

  .lc-btn-secondary {
    background: rgba(255,255,255,0.05);
    color: #FFFFFF;
    border: 1px solid rgba(255,255,255,0.15);
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  }
  @media (min-width: 768px) {
    .lc-btn-secondary {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  }
  .lc-btn-secondary:hover {
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.30);
    transform: translateY(-2px);
  }
  .lc-btn-secondary:active { transform: translateY(0); }

  .lc-heading {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter:
      drop-shadow(0px 12px 24px rgba(0,0,0,0.8))
      drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }
`;

export interface CTASectionProps {
  heading?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CTASection({
  heading = "Join the label.",
  description = "Submit your demo and become part of a growing community of independent artists.",
  primaryLabel = "Apply Now",
  primaryHref = "/auth/register",
  secondaryLabel = "Sign In",
  secondaryHref = "/auth/login",
}: CTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Initial states — skip blur on mobile
      if (IS_MOBILE) {
        gsap.set(".lc-bg-image",   { scale: 1.05 });
        gsap.set(".lc-bg-overlay", { opacity: 0.1 });
        gsap.set(".lc-heading",    { autoAlpha: 0, y: 40, scale: 0.95 });
        gsap.set(".lc-description",{ autoAlpha: 0, y: 30 });
        gsap.set(".lc-btn",        { autoAlpha: 0, y: 20, scale: 0.95 });
      } else {
        gsap.set(".lc-bg-image",   { scale: 1.12, filter: "blur(20px)" });
        gsap.set(".lc-bg-overlay", { opacity: 0.1 });
        gsap.set(".lc-heading",    { autoAlpha: 0, y: 70, filter: "blur(20px)", scale: 0.92 });
        gsap.set(".lc-description",{ autoAlpha: 0, y: 40, filter: "blur(10px)" });
        gsap.set(".lc-btn",        { autoAlpha: 0, y: 30, scale: 0.9, filter: "blur(8px)" });
      }

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: IS_MOBILE ? "+=1200" : "+=1800",
          pin: true,
          scrub: IS_MOBILE ? 0.3 : 1,
          anticipatePin: 1,
        },
      });

      if (IS_MOBILE) {
        scrollTl
          .to(".lc-bg-image",   { scale: 1, ease: "power2.out", duration: 1.5 }, 0)
          .to(".lc-bg-overlay", { opacity: 1, ease: "power2.inOut", duration: 2 }, 0)
          .to(".lc-heading",    { autoAlpha: 1, y: 0, scale: 1, ease: "expo.out", duration: 1.5 }, 0.5)
          .to(".lc-description",{ autoAlpha: 1, y: 0, ease: "expo.out", duration: 1.2 }, 1)
          .to(".lc-btn",        { autoAlpha: 1, y: 0, scale: 1, ease: "back.out(1.3)", duration: 1, stagger: 0.2 }, 1.3)
          .to({}, { duration: 1 });
      } else {
        scrollTl
          .to(".lc-bg-image",   { scale: 1, filter: "blur(4px)", ease: "power2.out", duration: 1.5 }, 0)
          .to(".lc-bg-image",   { filter: "blur(0px)", ease: "none", duration: 1.5 }, 1.5)
          .to(".lc-bg-overlay", { opacity: 1, ease: "power2.inOut", duration: 2.5 }, 0)
          .to(".lc-heading",    { autoAlpha: 1, y: 0, filter: "blur(0px)", scale: 1, ease: "expo.out", duration: 2 }, 0.8)
          .to(".lc-description",{ autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "expo.out", duration: 1.6 }, 1.4)
          .to(".lc-btn",        { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "back.out(1.3)", duration: 1.4, stagger: 0.25 }, 1.8)
          .to({}, { duration: 2 });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Banner background */}
      <div className="lc-bg-image absolute inset-0 z-0">
        <Image src="/lostbanner.png" alt="" fill className="object-cover" priority={false} />
      </div>

      {/* Overlays */}
      <div className="lc-bg-overlay absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/55 to-black" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black via-black/85 to-transparent" />
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 180px rgba(0,0,0,0.7)" }} />
      </div>

      {/* Top fade from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 z-10 bg-linear-to-b from-black to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full max-w-3xl mx-auto">
        <h2 className="lc-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          {heading}
        </h2>
        <p className="lc-description text-white/65 text-lg md:text-xl mb-12 font-light leading-relaxed max-w-lg mx-auto">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href={primaryHref}
            data-magnetic
            className="lc-btn lc-btn-primary group flex items-center gap-4 pl-5 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40 min-w-52"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(0,0,0,0.07)" }}>
              <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-0.5">For new artists</div>
              <div className="text-[17px] font-bold leading-none tracking-tight">{primaryLabel}</div>
            </div>
            <svg className="ml-auto h-4 w-4 opacity-35 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href={secondaryHref}
            data-magnetic
            className="lc-btn lc-btn-secondary group flex items-center gap-4 pl-5 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 min-w-52"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
              <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Already a member</div>
              <div className="text-[17px] font-bold leading-none tracking-tight">{secondaryLabel}</div>
            </div>
            <svg className="ml-auto h-4 w-4 opacity-30 -translate-x-1 transition-all duration-300 group-hover:opacity-70 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
