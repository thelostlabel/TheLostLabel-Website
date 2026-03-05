"use client";

/**
 * Magic UI – Ripple
 * Concentric expanding circles emanating from the center.
 * Usage: place inside a `position: relative; overflow: hidden` container.
 */
export default function Ripple({
  numRipples = 5,
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  duration = 3.5,
  color = "255,255,255",
  style = {},
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        ...style,
      }}
    >
      {Array.from({ length: numRipples }).map((_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = mainCircleOpacity - i * 0.04;
        const delay = i * (duration / numRipples);

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1px solid rgba(${color}, ${Math.max(opacity, 0.03)})`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `ripple-expand ${duration}s ease-out ${delay}s infinite`,
              opacity: 0,
            }}
          />
        );
      })}

      <style>{`
        @keyframes ripple-expand {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
