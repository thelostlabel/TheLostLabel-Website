"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

// ── Constants ──────────────────────────────────────────────────────────────────
const MAGNETIC_RADIUS = 80;
const MAGNETIC_PULL = 0.35;
const MAGNETIC_ELEMENT_SHIFT = 0.15;
const TRAIL_COUNT = 4;
const TRAIL_BASE_SIZE = 6;
const RING_SIZE = 36;
const DOT_SIZE = 8;

// ── Styles injected once ───────────────────────────────────────────────────────
const CURSOR_STYLES = `
  @media (pointer: fine) and (min-width: 1024px) {
    * { cursor: none !important; }
  }
`;

export function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isTouch = useRef(false);
  const rafId = useRef<number>(0);
  const magneticEls = useRef<HTMLElement[]>([]);
  const hovering = useRef(false);

  // Track trail positions (ring of previous positions)
  const trailPositions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }))
  );

  const setTrailRef = useCallback(
    (el: HTMLDivElement | null, i: number) => {
      trailRefs.current[i] = el;
    },
    []
  );

  useEffect(() => {
    // Detect touch device
    const mql = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    if (!mql.matches) {
      isTouch.current = true;
      return;
    }

    const handleMediaChange = (e: MediaQueryListEvent) => {
      isTouch.current = !e.matches;
      if (isTouch.current) {
        // Hide cursor elements when switching to touch
        [dotRef.current, ringRef.current, ...trailRefs.current].forEach(
          (el) => el && (el.style.opacity = "0")
        );
      }
    };
    mql.addEventListener("change", handleMediaChange);

    // ── Collect magnetic elements ──────────────────────────────────────────
    const refreshMagnetics = () => {
      magneticEls.current = Array.from(
        document.querySelectorAll<HTMLElement>("[data-magnetic]")
      );
    };
    refreshMagnetics();
    const observer = new MutationObserver(refreshMagnetics);
    observer.observe(document.body, { childList: true, subtree: true });

    // ── GSAP quickTo for buttery ring follow ───────────────────────────────
    const ringX = gsap.quickTo(ringRef.current!, "x", {
      duration: 0.45,
      ease: "power3.out",
    });
    const ringY = gsap.quickTo(ringRef.current!, "y", {
      duration: 0.45,
      ease: "power3.out",
    });

    // ── Mouse move handler ─────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── Hover detection for links / buttons ────────────────────────────────
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a, button, [role='button'], input, textarea, select, label")
      ) {
        hovering.current = true;
        gsap.to(ringRef.current, {
          scale: 1.5,
          borderColor: "rgba(255,255,255,0.6)",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(dotRef.current, {
          scale: 0.4,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };
    const onPointerOut = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a, button, [role='button'], input, textarea, select, label")
      ) {
        hovering.current = false;
        gsap.to(ringRef.current, {
          scale: 1,
          borderColor: "rgba(255,255,255,0.5)",
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(dotRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });

    // ── Animation loop ─────────────────────────────────────────────────────
    const tick = () => {
      if (isTouch.current) {
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      let cursorX = mousePos.current.x;
      let cursorY = mousePos.current.y;

      // ── Magnetic pull ──────────────────────────────────────────────────
      for (const el of magneticEls.current) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cursorX - cx;
        const dy = cursorY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAGNETIC_RADIUS) {
          const strength = 1 - dist / MAGNETIC_RADIUS;
          // Pull cursor toward element center
          cursorX -= dx * MAGNETIC_PULL * strength;
          cursorY -= dy * MAGNETIC_PULL * strength;
          // Shift element toward cursor
          gsap.to(el, {
            x: dx * MAGNETIC_ELEMENT_SHIFT * strength,
            y: dy * MAGNETIC_ELEMENT_SHIFT * strength,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.4)",
            overwrite: "auto",
          });
        }
      }

      // ── Position dot (instant) ─────────────────────────────────────────
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${cursorX - DOT_SIZE / 2}px, ${cursorY - DOT_SIZE / 2}px)`;
      }

      // ── Position ring (GSAP spring) ────────────────────────────────────
      ringPos.current.x = cursorX - RING_SIZE / 2;
      ringPos.current.y = cursorY - RING_SIZE / 2;
      ringX(ringPos.current.x);
      ringY(ringPos.current.y);

      // ── Trail positions (each follows the one ahead with lag) ──────────
      const positions = trailPositions.current;
      const leader = { x: cursorX, y: cursorY };
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const target = i === 0 ? leader : positions[i - 1];
        positions[i].x += (target.x - positions[i].x) * (0.25 - i * 0.04);
        positions[i].y += (target.y - positions[i].y) * (0.25 - i * 0.04);
        const trail = trailRefs.current[i];
        if (trail) {
          const size = TRAIL_BASE_SIZE - i * 1;
          trail.style.transform = `translate(${positions[i].x - size / 2}px, ${positions[i].y - size / 2}px)`;
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      mql.removeEventListener("change", handleMediaChange);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CURSOR_STYLES }} />

      {/* Trail dots */}
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <div
          key={`trail-${i}`}
          ref={(el) => setTrailRef(el, i)}
          className="fixed top-0 left-0 pointer-events-none rounded-full hidden lg:block"
          style={{
            width: TRAIL_BASE_SIZE - i,
            height: TRAIL_BASE_SIZE - i,
            background: `rgba(255, 255, 255, ${0.25 - i * 0.055})`,
            zIndex: 99996,
            willChange: "transform",
          }}
        />
      ))}

      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full hidden lg:block"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          background: "#fff",
          boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
          zIndex: 99999,
          willChange: "transform",
        }}
      />

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full hidden lg:block"
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          border: "1.5px solid rgba(255,255,255,0.5)",
          zIndex: 99998,
          willChange: "transform",
        }}
      />
    </>
  );
}
