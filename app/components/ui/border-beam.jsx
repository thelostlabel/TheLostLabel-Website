"use client";

/**
 * Magic UI – Border Beam
 * An animated beam of light that rotates around a card's border.
 * Usage: place inside a `position: relative` parent.
 */
export default function BorderBeam({
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "rgba(255,255,255,0.8)",
  colorTo = "rgba(255,255,255,0)",
  borderWidth = 1.5,
  style = {},
}) {
  return (
    <>
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          padding: `${borderWidth}px`,
          background: "rgba(255,255,255,0.06)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          zIndex: 0,
          ...style,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            aspectRatio: "1",
            width: `${size}px`,
            background: `conic-gradient(from 0deg, ${colorTo}, ${colorFrom} 10%, ${colorTo} 20%)`,
            animation: `border-beam-spin ${duration}s linear ${delay}s infinite`,
            transformOrigin: "center",
            top: "50%",
            left: "50%",
            translate: "-50% -50%",
            filter: "blur(4px)",
          }}
        />
      </span>

      <style>{`
        @keyframes border-beam-spin {
          from { transform: rotate(0deg) scale(3); }
          to   { transform: rotate(360deg) scale(3); }
        }
      `}</style>
    </>
  );
}
