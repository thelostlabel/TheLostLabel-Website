"use client";

import { useEffect, useRef } from "react";

function hexToRgb(hex) {
  let value = (hex || "#ffffff").replace("#", "");
  if (value.length === 3) {
    value = value.split("").map((char) => char + char).join("");
  }
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export default function Particles({
  className = "",
  quantity = 50,
  staticity = 55,
  ease = 60,
  size = 0.5,
  color = "#ffffff",
  vx = 0,
  vy = 0
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);
  const circlesRef = useRef([]);
  const rafRef = useRef(null);
  const resizeTimerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const dprRef = useRef(1);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    dprRef.current = window.devicePixelRatio || 1;
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
    }

    const handleMouseMove = (event) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - sizeRef.current.w / 2;
      const y = event.clientY - rect.top - sizeRef.current.h / 2;
      const inside =
        x < sizeRef.current.w / 2 &&
        x > -sizeRef.current.w / 2 &&
        y < sizeRef.current.h / 2 &&
        y > -sizeRef.current.h / 2;
      if (inside) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
      }
    };

    const circleParams = () => {
      const x = Math.floor(Math.random() * sizeRef.current.w);
      const y = Math.floor(Math.random() * sizeRef.current.h);
      const pSize = Math.floor(Math.random() * 2) + size;
      return {
        x,
        y,
        translateX: 0,
        translateY: 0,
        size: pSize,
        alpha: 0,
        targetAlpha: parseFloat((Math.random() * 0.5 + 0.12).toFixed(2)),
        dx: (Math.random() - 0.5) * 0.12,
        dy: (Math.random() - 0.5) * 0.12,
        magnetism: 0.08 + Math.random() * 3.6
      };
    };

    const rgb = hexToRgb(color);

    const drawCircle = (circle, update = false) => {
      if (!contextRef.current) return;
      const { x, y, translateX, translateY, size: particleSize, alpha } = circle;
      contextRef.current.translate(translateX, translateY);
      contextRef.current.beginPath();
      contextRef.current.arc(x, y, particleSize, 0, 2 * Math.PI);
      contextRef.current.fillStyle = `rgba(${rgb.join(",")}, ${alpha})`;
      contextRef.current.fill();
      contextRef.current.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      if (!update) circlesRef.current.push(circle);
    };

    const clearContext = () => {
      if (!contextRef.current) return;
      contextRef.current.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);
    };

    const remapValue = (value, start1, end1, start2, end2) => {
      const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
      return remapped > 0 ? remapped : 0;
    };

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current || !contextRef.current) return;
      sizeRef.current.w = containerRef.current.offsetWidth;
      sizeRef.current.h = containerRef.current.offsetHeight;

      canvasRef.current.width = sizeRef.current.w * dprRef.current;
      canvasRef.current.height = sizeRef.current.h * dprRef.current;
      canvasRef.current.style.width = `${sizeRef.current.w}px`;
      canvasRef.current.style.height = `${sizeRef.current.h}px`;
      contextRef.current.setTransform(1, 0, 0, 1, 0, 0);
      contextRef.current.scale(dprRef.current, dprRef.current);

      circlesRef.current = [];
      for (let i = 0; i < quantity; i += 1) {
        drawCircle(circleParams());
      }
    };

    const animate = () => {
      clearContext();
      circlesRef.current.forEach((circle, index) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          sizeRef.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          sizeRef.current.h - circle.y - circle.translateY - circle.size
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));

        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }

        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mouseRef.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY +=
          (mouseRef.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        drawCircle(circle, true);

        if (
          circle.x < -circle.size ||
          circle.x > sizeRef.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > sizeRef.current.h + circle.size
        ) {
          circlesRef.current.splice(index, 1);
          drawCircle(circleParams());
        }
      });
      rafRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    const handleResize = () => {
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        resizeCanvas();
      }, 180);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [color, ease, quantity, size, staticity, vx, vy]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}

