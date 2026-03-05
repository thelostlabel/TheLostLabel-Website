"use client";
import { useRef, useState } from "react";
import {
  useScroll,
  useSpring,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

/** Wraps a value between min and max (like modulo but smooth) */
function wrap(min, max, v) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function VelocityRow({ text, baseVelocity = 5, className = "", style = {}, scrollFactor = 5 }) {
  const [xPercent, setXPercent] = useState(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });

  // Her zaman kendi yönüne göre hızlanır — ters yöne dönmez
  const baseDir = baseVelocity >= 0 ? 1 : -1;
  const xRef = useRef(0);

  useAnimationFrame((_, delta) => {
    const rawVf = smoothVelocity.get();
    // Scroll hızını normalize et ve base direction ile çarp, böylece kendi yönüne göre hızlanır
    const boost = (rawVf / 1000) * scrollFactor * baseDir;
    const speed = Math.abs(baseVelocity) + Math.max(0, boost * baseDir);
    const moveBy = baseDir * speed * (delta / 1000);
    xRef.current = wrap(-50, 0, xRef.current + moveBy);
    setXPercent(xRef.current);
  });

  const repeated = `${text}   ·   `.repeat(6);

  return (
    <div style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap" }}>
      <div style={{ transform: `translateX(${xPercent}%)`, display: "flex", willChange: "transform" }}>
        <span className={className} style={style}>{repeated}</span>
        <span className={className} style={style}>{repeated}</span>
      </div>
    </div>
  );
}

/**
 * Magic UI – Scroll-Based Velocity Marquee
 * Rows alternate direction; scroll speed boosts velocity.
 *
 * Props:
 *  texts        string[]  — one string per row
 *  baseVelocity number    — base px/s (default 4)
 *  scrollFactor number    — scroll amplification (default 5)
 *  className    string    — class on each text span
 *  style        object    — inline styles on each text span
 */
export default function ScrollBasedVelocity({
  texts = [],
  baseVelocity = 4,
  scrollFactor = 5,
  className = "",
  style = {},
}) {
  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      {texts.map((text, i) => (
        <VelocityRow
          key={i}
          text={text}
          baseVelocity={i % 2 === 0 ? baseVelocity : -baseVelocity}
          scrollFactor={scrollFactor}
          className={className}
          style={style}
        />
      ))}
    </div>
  );
}
