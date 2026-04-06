"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { HandwrittenLogo } from "@/components/ui/handwritten-logo";
import { usePublicSettings } from "@/app/components/PublicSettingsContext";

export function PageReveal() {
  const publicSettings = usePublicSettings();
  const [visible, setVisible] = useState(true);
  const hasPlayed = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const topHalfRef = useRef<HTMLDivElement>(null);
  const bottomHalfRef = useRef<HTMLDivElement>(null);
  const [drawDone, setDrawDone] = useState(false);

  useEffect(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Once the handwriting draw animation finishes, split & dismiss
  useEffect(() => {
    if (!drawDone) return;

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, 0);
        setVisible(false);
      },
    });

    // Brief hold so the brand is readable
    tl.to(brandRef.current, { duration: 0.35 });

    // Brand fades out while halves split
    tl.to(
      brandRef.current,
      { opacity: 0, duration: 0.25, ease: "power2.in" },
      "+=0"
    );

    tl.to(
      topHalfRef.current,
      { yPercent: -100, duration: 0.7, ease: "expo.out" },
      "-=0.15"
    );

    tl.to(
      bottomHalfRef.current,
      { yPercent: 100, duration: 0.7, ease: "expo.out" },
      "<"
    );

    return () => {
      tl.kill();
    };
  }, [drawDone]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-auto touch-none overscroll-none"
      aria-hidden="true"
    >
      {/* Top half */}
      <div
        ref={topHalfRef}
        className="absolute inset-x-0 top-0 h-1/2 bg-black"
      />
      {/* Bottom half */}
      <div
        ref={bottomHalfRef}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-black"
      />
      {/* Brand text centered — handwritten draw animation */}
      <div
        ref={brandRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px]"
        style={{
          filter: "drop-shadow(0px 10px 20px rgba(255,255,255,0.15)) drop-shadow(0px 2px 4px rgba(255,255,255,0.10))",
        }}
      >
        <HandwrittenLogo
          text={publicSettings.brandingFullName || "The Lost Company"}
          animate
          duration={2}
          delay={0.3}
          color="#ffffff"
          font="bofly"
          onAnimationEnd={() => setDrawDone(true)}
        />
      </div>
    </div>
  );
}
