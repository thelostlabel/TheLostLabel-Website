"use client";
import ScrollBasedVelocity from "./ui/scroll-based-velocity";

const ROW_1 = "SPOTIFY · APPLE MUSIC · TIKTOK · YOUTUBE · INSTAGRAM · AMAZON MUSIC · DEEZER · TIDAL · SOUNDCLOUD · AUDIOMACK";
const ROW_2 = "DISTRIBUTION · ROYALTIES · SYNC LICENSING · MARKETING · A&R · MASTERING · PUBLISHING · PROMOTION";

export default function PartnersSection() {
  return (
    <section
      style={{
        padding: "80px 0",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* Fade edges */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "18vw",
        background: "linear-gradient(to right, #06070a, transparent)", zIndex: 2, pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "18vw",
        background: "linear-gradient(to left, #06070a, transparent)", zIndex: 2, pointerEvents: "none"
      }} />

      <ScrollBasedVelocity
        texts={[ROW_1, ROW_2]}
        baseVelocity={1.2}
        scrollFactor={3}
        style={{
          fontSize: "clamp(28px, 4vw, 56px)",
          fontWeight: "900",
          letterSpacing: "-1px",
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          padding: "8px 0",
          WebkitTextStroke: "0px",
          cursor: "default",
          userSelect: "none",
        }}
      />
    </section>
  );
}
