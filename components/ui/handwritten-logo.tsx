// components/ui/handwritten-logo.tsx
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HandwrittenLogoProps {
  text?: string;
  className?: string;
  animate?: boolean;
  duration?: number;
  delay?: number;
  onAnimationEnd?: () => void;
  color?: string;
  font?: "bofly" | "kalste";
}

export function HandwrittenLogo({
  text = "The Lost Company",
  className,
  animate = true,
  duration = 2.5,
  delay = 0,
  onAnimationEnd,
  color = "#ffffff",
  font = "bofly",
}: HandwrittenLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const [ready, setReady] = useState(false);
  const [dims, setDims] = useState({ width: 800, height: 120 });

  const fontFamily = font === "bofly" ? "Bofly" : "Kalste";
  const fontSrc = font === "bofly" ? "/fonts/Bofly.ttf" : "/fonts/Kalste.otf";
  const fontFormat = font === "bofly" ? "truetype" : "opentype";

  const reactId = useId();
  const uid = `hw${reactId.replace(/:/g, "")}`;

  // Register @font-face and wait for load
  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleId = `font-face-${fontFamily}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontSrc}') format('${fontFormat}');
          font-weight: normal;
          font-style: normal;
          font-display: block;
        }
      `;
      document.head.appendChild(style);
    }

    document.fonts.ready.then(() => {
      if (document.fonts.check(`48px "${fontFamily}"`)) {
        setReady(true);
      } else {
        setTimeout(() => setReady(true), 400);
      }
    });
  }, [fontFamily, fontSrc, fontFormat]);

  // Measure text once font is ready
  useEffect(() => {
    if (!ready || !textRef.current) return;
    const bbox = textRef.current.getBBox();
    if (bbox.width > 0) {
      setDims({
        width: Math.ceil(bbox.width + 40),
        height: Math.ceil(bbox.height + 30),
      });
    }
  }, [ready, text]);

  return (
    <>
      <style>{`
        @keyframes ${uid}-draw {
          0% {
            stroke-dashoffset: var(--dash-length);
            fill-opacity: 0;
          }
          70% {
            stroke-dashoffset: 0;
            fill-opacity: 0;
          }
          100% {
            stroke-dashoffset: 0;
            fill-opacity: 1;
          }
        }
        .${uid}-text {
          font-family: '${fontFamily}', cursive;
          ${animate ? `
          stroke: ${color};
          stroke-width: 1.5;
          fill: ${color};
          fill-opacity: 0;
          stroke-dasharray: var(--dash-length);
          stroke-dashoffset: var(--dash-length);
          animation: ${uid}-draw ${duration}s ease-in-out ${delay}s forwards;
          ` : `
          fill: ${color};
          fill-opacity: 1;
          stroke: none;
          `}
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        className={cn("select-none w-full", className)}
        aria-label={text}
        role="img"
      >
        <text
          ref={textRef}
          x="20"
          y={dims.height * 0.72}
          className={`${uid}-text`}
          style={{ "--dash-length": "2000px" } as React.CSSProperties}
          fontSize="72"
          onAnimationEnd={onAnimationEnd}
        >
          {text}
        </text>
      </svg>
    </>
  );
}
