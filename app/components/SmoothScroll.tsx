"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll(): null {
  const pathname = usePathname();

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const shouldDisable =
      isMobile ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      pathname?.startsWith("/dashboard");

    if (shouldDisable) {
      return undefined;
    }

    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    const lenis = new Lenis({
      duration: isDesktop ? 1.35 : 1.05,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 0.95,
      wheelMultiplier: isDesktop ? 0.55 : 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });

    const onScroll = () => ScrollTrigger.update();
    let frameId = 0;

    lenis.on("scroll", onScroll);

    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
      ScrollTrigger.clearScrollMemory();
    };
  }, [pathname]);

  return null;
}
