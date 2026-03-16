"use client";
import { useState, useRef, useMemo } from "react";
import { motion, useSpring, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import { Music, ArrowRight } from "lucide-react";

// ---- Artist Card with 3D tilt ----
const ArtistCard = ({ artist }) => {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 14);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <Link href={`/artists/${artist.id}`} style={{ textDecoration: "none", display: "block", flexShrink: 0 }}>
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: "800px", cursor: "pointer", padding: "5px" }}
      >
        <motion.div
          style={{
            rotateX, rotateY,
            transformStyle: "preserve-3d",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            aspectRatio: "3/4",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {artist.image ? (
            <motion.div
              animate={{ scale: hovered ? 1.08 : 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0 }}
            >
              <NextImage src={artist.image} alt={artist.name} fill sizes="(max-width: 768px) 50vw, 33vw" style={{ objectFit: "cover" }} />
            </motion.div>
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f0f15, #1a1a28)", display: "grid", placeItems: "center" }}>
              <Music size={32} color="#2a2a3a" />
            </div>
          )}

          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 14px 12px",
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)",
          }}>
            <h3 style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", color: "#fff", margin: 0, lineHeight: 1.2 }}>
              {artist.name}
            </h3>
          </div>

          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)" }}
          />
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", inset: -1, borderRadius: "13px", border: "1px solid rgba(255,255,255,0.15)", pointerEvents: "none" }}
          />
        </motion.div>
      </motion.div>
    </Link>
  );
};

// ---- Main Section: scroll-linked 5 columns ----
export default function ArtistsSection({ artists: propArtists }) {
  const artists = propArtists || [];

  const containerRef = useRef(null);

  // GPU-accelerated scroll tracking via framer-motion useScroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 80, damping: 25 };

  // Column scroll amounts — 5 columns, each different direction/speed (no re-renders)
  const col1Y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -600]), springConfig);
  const col2Y = useSpring(useTransform(scrollYProgress, [0, 1], [0, 450]), springConfig);
  const col3Y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -540]), springConfig);
  const col4Y = useSpring(useTransform(scrollYProgress, [0, 1], [0, 360]), springConfig);
  const col5Y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -510]), springConfig);

  // Memoize column distribution
  const columns = useMemo(() => {
    const cols = [[], [], [], [], []];
    artists.forEach((a, i) => cols[i % 5].push(a));
    return cols;
  }, [artists]);

  // Memoize expanded lists for each column
  const expandedColumns = useMemo(() => {
    return columns.map((col) =>
      col.length === 0 ? [] : Array.from({ length: Math.max(6, col.length) }, (_, i) => col[i % col.length])
    );
  }, [columns]);

  if (!artists.length) return null;

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative", zIndex: 10, height: "160vh", overflow: "hidden",
      }}
    >
      {/* Subtle background texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)",
      }} />

      {/* 5 Scroll-linked Columns */}
      <div style={{
        display: "flex", height: "100%", gap: "0px",
        maxWidth: "100%", margin: "0", padding: "0 1vw",
      }}>
        {[
          { y: col1Y, pt: "12vh", col: 0 },
          { y: col2Y, pt: "2vh", col: 1 },
          { y: col3Y, pt: "18vh", col: 2 },
          { y: col4Y, pt: "6vh", col: 3 },
          { y: col5Y, pt: "14vh", col: 4 },
        ].map(({ y, pt, col }, idx) => (
          <div key={idx} style={{ overflow: "hidden", height: "100%", flex: 1 }}>
            <motion.div style={{ y, display: "flex", flexDirection: "column", paddingTop: pt }}>
              {expandedColumns[col].map((a, i) => (
                <ArtistCard key={`${a.id}-c${col}-${i}`} artist={a} />
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Center overlay text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 20, pointerEvents: "none",
      }}>
        <div style={{ textAlign: "center", pointerEvents: "auto", position: "relative" }}>
          <div style={{
            position: "absolute", inset: "-80px -100px",
            background: "radial-gradient(ellipse at center, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.7) 45%, transparent 72%)",
            zIndex: -1,
          }} />
          <div style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "5px", color: "rgba(255,255,255,0.3)", marginBottom: "14px" }}>
            OUR ARTISTS
          </div>
          <h2 style={{
            fontSize: "clamp(52px, 9vw, 110px)", fontWeight: "900",
            letterSpacing: "-0.04em", margin: "0 0 28px", lineHeight: 0.9,
          }}>
            THE<br />
            <span style={{ fontStyle: "italic", fontWeight: "300" }}>ROSTER</span>
          </h2>
          <Link href="/artists" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            fontSize: "11px", fontWeight: "800", letterSpacing: "3px", color: "#fff",
            textDecoration: "none", padding: "14px 32px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.04)",
            transition: "all 0.3s ease",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            EXPLORE <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Edge fades — semi-transparent so BackgroundEffects show through */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25vh", background: "linear-gradient(to bottom, rgba(6,7,10,0.85), transparent)", pointerEvents: "none", zIndex: 10 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "25vh", background: "linear-gradient(to top, rgba(6,7,10,0.85), transparent)", pointerEvents: "none", zIndex: 10 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "8vw", background: "linear-gradient(to right, rgba(6,7,10,0.7), transparent)", pointerEvents: "none", zIndex: 10 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "8vw", background: "linear-gradient(to left, rgba(6,7,10,0.7), transparent)", pointerEvents: "none", zIndex: 10 }} />
    </section>
  );
}
