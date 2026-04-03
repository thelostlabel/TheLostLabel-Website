"use client";

import { useEffect, useRef } from "react";

interface AnimatedLogoProps {
  size?: number;
  color?: string;
  className?: string;
  duration?: number;
}

export default function AnimatedLogo({
  size = 200,
  color = "white",
  className = "",
  duration = 1.5,
}: AnimatedLogoProps) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    pathRefs.current.forEach((path, i) => {
      if (!path) return;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });

    // Trigger animation after a frame
    requestAnimationFrame(() => {
      pathRefs.current.forEach((path, i) => {
        if (!path) return;
        const length = path.getTotalLength();
        path.style.transition = `stroke-dashoffset ${duration}s ease ${i * 0.35}s, fill-opacity 0.4s ease ${i * 0.35 + duration}s`;
        path.style.strokeDashoffset = "0";
        path.style.fillOpacity = "1";
      });
    });
  }, [duration]);

  const setRef = (i: number) => (el: SVGPathElement | null) => {
    pathRefs.current[i] = el;
  };

  // Logo geometry (viewBox 0 0 100 100):
  // Main C-bracket shape: stepped/pixelated C open to the right
  // Two small rounded squares on the right (like a colon)

  const r = 4; // corner radius

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      {/* Main C/bracket shape - pixelated steps */}
      <path
        ref={setRef(0)}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={color}
        fillOpacity={0}
        d={[
          // Start top-right of the top bar
          `M 58 20`,
          // Top-left corner (rounded)
          `L ${24 + r} 20`,
          `Q 24 20 24 ${20 + r}`,
          // Down left side
          `L 24 ${80 - r}`,
          `Q 24 80 ${24 + r} 80`,
          // Bottom-right of bottom bar
          `L 58 80`,
          // Step up into the C opening (bottom inner)
          `L 58 68`,
          `L ${36 + r} 68`,
          `Q 36 68 36 ${68 - r}`,
          // Inner left side going up
          `L 36 ${32 + r}`,
          `Q 36 32 ${36 + r} 32`,
          // Step right to top inner
          `L 58 32`,
          // Close back to start
          `Z`,
        ].join(" ")}
      />

      {/* Top-right rounded square */}
      <rect
        ref={setRef(1) as any}
        x={62}
        y={32}
        width={16}
        height={16}
        rx={r}
        ry={r}
        stroke={color}
        strokeWidth={1.5}
        fill={color}
        fillOpacity={0}
      />

      {/* Bottom-right rounded square */}
      <rect
        ref={setRef(2) as any}
        x={62}
        y={52}
        width={16}
        height={16}
        rx={r}
        ry={r}
        stroke={color}
        strokeWidth={1.5}
        fill={color}
        fillOpacity={0}
      />
    </svg>
  );
}
