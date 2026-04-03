// components/ui/text-scramble.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const SCRAMBLE_CHARS = "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬";

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  delay?: number;
}

export function TextScramble({
  text,
  className,
  scrambleOnHover = false,
  delay = 0,
}: TextScrambleProps) {
  const [display, setDisplay] = useState("");
  const [isScrambling, setIsScrambling] = useState(false);
  const rafRef = useRef<number>(0);
  const hasPlayedRef = useRef(false);

  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);

    const length = text.length;
    const duration = 1500; // ms
    const startTime = performance.now();
    // Each character has a resolve time spread across the duration
    // with slight randomness
    const resolveTimes = Array.from({ length }, (_, i) => {
      const base = (i / length) * duration * 0.85;
      const jitter = Math.random() * (duration * 0.15);
      return base + jitter;
    });

    const tick = (now: number) => {
      const elapsed = now - startTime;
      let result = "";

      for (let i = 0; i < length; i++) {
        if (elapsed >= resolveTimes[i]) {
          result += text[i];
        } else {
          result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }

      setDisplay(result);

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
        setIsScrambling(false);
      }
    };

    // Start with fully scrambled text
    setDisplay(
      Array.from({ length }, () =>
        SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      ).join("")
    );

    rafRef.current = requestAnimationFrame(tick);
  }, [text, isScrambling]);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasPlayedRef.current = true;
      scramble();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (scrambleOnHover && hasPlayedRef.current) {
      scramble();
    }
  }, [scrambleOnHover, scramble]);

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
      style={isScrambling ? { fontFamily: "monospace" } : undefined}
    >
      {display || text}
    </span>
  );
}
