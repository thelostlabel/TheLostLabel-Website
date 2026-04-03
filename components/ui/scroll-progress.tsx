"use client";

import React, { useEffect, useRef, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
const TRACK_HEIGHT = 200;
const TRACK_WIDTH = 2;
const DOT_SIZE = 8;
const FADE_IN_SCROLL = 100;
const SECTION_SELECTORS = [
  "[data-section]",
  "section",
  "main > div > div",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getSections(): HTMLElement[] {
  for (const sel of SECTION_SELECTORS) {
    const els = document.querySelectorAll<HTMLElement>(sel);
    if (els.length > 1) return Array.from(els);
  }
  return [];
}

function getScrollProgress(): number {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 0;
  return clamp(scrollTop / docHeight, 0, 1);
}

function getActiveSection(sections: HTMLElement[]): number {
  const midY = window.scrollY + window.innerHeight * 0.4;
  let active = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].offsetTop <= midY) active = i;
  }
  return active;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ScrollProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const glowDotRef = useRef<HTMLDivElement>(null);
  const sectionDotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const rafId = useRef<number>(0);
  const ticking = useRef(false);

  const updateProgress = useCallback(() => {
    const container = containerRef.current;
    const fill = fillRef.current;
    const glowDot = glowDotRef.current;
    if (!container || !fill || !glowDot) return;

    const progress = getScrollProgress();
    const scrollTop = window.scrollY;

    // Fade in/out based on scroll position
    const opacity = clamp(scrollTop / FADE_IN_SCROLL, 0, 1);
    container.style.opacity = String(opacity);

    // Fill height
    const fillHeight = progress * TRACK_HEIGHT;
    fill.style.height = `${fillHeight}px`;

    // Glow dot position
    glowDot.style.top = `${fillHeight - DOT_SIZE / 2}px`;

    // Active section
    const sections = sectionsRef.current;
    if (sections.length > 1) {
      const active = getActiveSection(sections);
      sectionDotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        if (i === active) {
          dot.style.width = "6px";
          dot.style.height = "6px";
          dot.style.opacity = "1";
          dot.style.boxShadow = "0 0 6px rgba(255,255,255,0.4)";
        } else {
          dot.style.width = "4px";
          dot.style.height = "4px";
          dot.style.opacity = "0.35";
          dot.style.boxShadow = "none";
        }
      });
    }

    ticking.current = false;
  }, []);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true;
      rafId.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress]);

  // Discover sections and set up dots
  const [sectionCount, setSectionCount] = React.useState(0);

  useEffect(() => {
    // Wait for DOM to settle
    const timer = setTimeout(() => {
      const sections = getSections();
      sectionsRef.current = sections;
      setSectionCount(sections.length > 1 ? sections.length : 0);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial call
    updateProgress();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [onScroll, updateProgress]);

  // Compute section dot positions along the track
  const sectionDotPositions =
    sectionCount > 1
      ? Array.from({ length: sectionCount }, (_, i) => {
          const sections = sectionsRef.current;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight <= 0) return (i / (sectionCount - 1)) * TRACK_HEIGHT;
          const pos = clamp(sections[i].offsetTop / docHeight, 0, 1);
          return pos * TRACK_HEIGHT;
        })
      : [];

  return (
    <div
      ref={containerRef}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col items-center pointer-events-none"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Track */}
      <div
        className="relative rounded-full"
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          background: "rgba(255,255,255,0.1)",
        }}
      >
        {/* Fill */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 rounded-full"
          style={{
            width: TRACK_WIDTH,
            height: 0,
            background: "white",
            boxShadow: "0 0 8px rgba(255,255,255,0.25)",
            transition: "height 0.12s ease-out",
          }}
        />

        {/* Glow dot */}
        <div
          ref={glowDotRef}
          className="absolute rounded-full"
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            left: -(DOT_SIZE - TRACK_WIDTH) / 2,
            top: -(DOT_SIZE / 2),
            background: "white",
            boxShadow:
              "0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.2)",
            transition: "top 0.12s ease-out",
          }}
        />

        {/* Section dots */}
        {sectionDotPositions.map((top, i) => (
          <div
            key={i}
            ref={(el) => {
              sectionDotsRef.current[i] = el;
            }}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              left: -(4 - TRACK_WIDTH) / 2,
              top: top - 2,
              background: "white",
              opacity: 0.35,
              transition: "all 0.25s ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
