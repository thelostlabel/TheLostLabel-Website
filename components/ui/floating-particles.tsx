// components/ui/floating-particles.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { IS_MOBILE } from "@/lib/is-mobile";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  glow: boolean;
}

interface FloatingParticlesProps {
  className?: string;
  count?: number;
}

export function FloatingParticles({
  className = "",
  count = 50,
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (IS_MOBILE) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas!.width = rect.width;
      canvas!.height = rect.height;
    }

    function initParticles() {
      const w = canvas!.width;
      const h = canvas!.height;
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + Math.random() * 2,
        speed: 0.15 + Math.random() * 0.35,
        opacity: 0.1 + Math.random() * 0.4,
        glow: Math.random() < 0.25,
      }));
    }

    resize();
    initParticles();

    const onResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouseMove);

    if (prefersReducedMotion) {
      // Draw a single static frame
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMouseMove);
      };
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      // Parallax offset: center mouse at (0.5, 0.5), max shift 20px
      const offsetX = (mouseRef.current.x - 0.5) * 40; // +-20px
      const offsetY = (mouseRef.current.y - 0.5) * 40;

      for (const p of particlesRef.current) {
        p.y -= p.speed;

        // Wrap when particle leaves top
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }

        const drawX = p.x + offsetX;
        const drawY = p.y + offsetY;
        const radius = p.size * 0.5;

        // Simplified glow — slightly larger + brighter circle instead of
        // per-particle radial-gradient which is expensive at 50 particles/frame
        if (p.glow) {
          ctx!.globalAlpha = p.opacity * 0.35;
          ctx!.fillStyle = "#ffffff";
          ctx!.beginPath();
          ctx!.arc(drawX, drawY, radius * 2.5, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = "#ffffff";
        ctx!.beginPath();
        ctx!.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [count]);

  if (IS_MOBILE) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.6,
      }}
      aria-hidden="true"
    />
  );
}
