"use client";
import { motion } from "framer-motion";

/**
 * Magic UI – Shimmer Button
 * A button with a moving shimmer/glint effect traversing across.
 */
export default function ShimmerButton({
  children,
  className = "",
  style = {},
  shimmerColor = "rgba(255,255,255,0.15)",
  shimmerSize = "0.1em",
  shimmerDuration = "2.5s",
  background = "#fff",
  color = "#000",
  borderRadius = "0px",
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        background,
        color,
        border: "none",
        borderRadius,
        cursor: "pointer",
        fontWeight: "900",
        letterSpacing: "2px",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      {...props}
    >
      {/* Shimmer sweep */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          backgroundSize: "200% 100%",
          animation: `shimmer-sweep ${shimmerDuration} linear infinite`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>

      <style>{`
        @keyframes shimmer-sweep {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>
    </motion.button>
  );
}
