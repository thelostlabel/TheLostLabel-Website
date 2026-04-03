"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { gsap } from "gsap";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  tiltMax?: number;
  glareOpacity?: number;
};

export default function TiltCard({
  children,
  className = "",
  tiltMax = 12,
  glareOpacity = 0.15,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useRef(false);
  const rotateXTo = useRef<gsap.QuickToFunc | null>(null);
  const rotateYTo = useRef<gsap.QuickToFunc | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    isTouchDevice.current =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (isTouchDevice.current || !cardRef.current) return;

    const card = cardRef.current;

    // GSAP quickTo for smooth interpolation
    rotateXTo.current = gsap.quickTo(card, "rotateX", {
      duration: 0.4,
      ease: "power2.out",
    });
    rotateYTo.current = gsap.quickTo(card, "rotateY", {
      duration: 0.4,
      ease: "power2.out",
    });

    // Set initial 3D transforms
    gsap.set(card, {
      transformPerspective: 800,
      transformStyle: "preserve-3d",
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice.current || !cardRef.current) return;

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const card = cardRef.current!;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width; // 0..1
        const py = (e.clientY - rect.top) / rect.height; // 0..1

        const rotateX = (0.5 - py) * tiltMax;
        const rotateY = (px - 0.5) * tiltMax;

        rotateXTo.current?.(rotateX);
        rotateYTo.current?.(rotateY);

        // Move glare overlay
        if (glareRef.current) {
          glareRef.current.style.background = `radial-gradient(
            600px circle at ${px * 100}% ${py * 100}%,
            rgba(255,255,255,${glareOpacity}) 0%,
            rgba(255,255,255,${glareOpacity * 0.4}) 25%,
            transparent 55%
          )`;
          glareRef.current.style.opacity = "1";
        }
      });
    },
    [tiltMax, glareOpacity],
  );

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice.current || !cardRef.current) return;

    gsap.to(cardRef.current, {
      scale: 1.03,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current || !cardRef.current) return;

    cancelAnimationFrame(rafId.current);

    // Spring back to flat
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
    });

    if (glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tilt-card relative ${className}`}
      style={{ willChange: "transform" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Glare overlay */}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 z-30 rounded-lg"
        style={{
          opacity: 0,
          mixBlendMode: "screen",
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}
