'use client';

import React, { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

interface WaveMaskTextProps {
  text?: string;
  className?: string;
  strokeColor?: string;
  lineCount?: number;
  amplitude?: number;
  speed?: number;
}

export function WaveMaskText({
  text = 'LOST',
  className = '',
  strokeColor = 'rgba(255,255,255,0.75)',
  lineCount = 28,
  amplitude = 10,
  speed = 0.008,
}: WaveMaskTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);
  const noiseRef = useRef<((x: number, y: number) => number) | null>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const tRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    noiseRef.current = createNoise2D();

    function build() {
      if (!svg || !container) return;
      const W = container.clientWidth;
      const H = container.clientHeight;

      svg.setAttribute('width', String(W));
      svg.setAttribute('height', String(H));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      // Clear previous
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      pathsRef.current = [];

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

      // Clip path using text
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', 'wave-text-mask');

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '50%');
      textEl.setAttribute('y', '82%');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'auto');
      textEl.setAttribute('font-size', String(Math.floor(H * 0.88)));
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-family', 'ui-sans-serif, system-ui, -apple-system, sans-serif');
      textEl.setAttribute('letter-spacing', '-0.04em');
      textEl.textContent = text;
      clipPath.appendChild(textEl);
      defs.appendChild(clipPath);
      svg.appendChild(defs);

      // Wave lines group clipped to text shape
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('clip-path', 'url(#wave-text-mask)');
      svg.appendChild(g);

      for (let i = 0; i < lineCount; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', '1.2');
        g.appendChild(path);
        pathsRef.current.push(path);
      }
    }

    function animate() {
      const W = container?.clientWidth ?? 800;
      const H = container?.clientHeight ?? 200;
      const noise = noiseRef.current;
      if (!noise) return;

      tRef.current += speed;
      const t = tRef.current;
      const segments = 120;

      pathsRef.current.forEach((path, i) => {
        const baseY = (H / (lineCount + 1)) * (i + 1);
        let d = '';

        for (let j = 0; j <= segments; j++) {
          const x = (W / segments) * j;
          const ny =
            baseY +
            noise(x * 0.004 + t, baseY * 0.006 + t * 0.4) * amplitude +
            noise(x * 0.009 - t * 0.6, baseY * 0.003) * (amplitude * 0.5);

          d += j === 0 ? `M ${x.toFixed(1)} ${ny.toFixed(2)}` : ` L ${x.toFixed(1)} ${ny.toFixed(2)}`;
        }

        path.setAttribute('d', d);
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    build();
    rafRef.current = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => { build(); });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [text, strokeColor, lineCount, amplitude, speed]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-full"
      />
    </div>
  );
}
