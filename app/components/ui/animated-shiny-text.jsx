"use client";

/**
 * Magic UI – Animated Shiny Text
 * Text with a repeating shimmer sweep — great for badges and labels.
 */
export default function AnimatedShinyText({
  children,
  className = "",
  style = {},
  shimmerWidth = 100,
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        position: "relative",
        background: `linear-gradient(
          90deg,
          rgba(255,255,255,0.55) 0%,
          rgba(255,255,255,1) ${shimmerWidth / 2}%,
          rgba(255,255,255,0.55) ${shimmerWidth}%
        )`,
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "shiny-text-sweep 3s linear infinite",
        ...style,
      }}
    >
      {children}
      <style>{`
        @keyframes shiny-text-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </span>
  );
}
