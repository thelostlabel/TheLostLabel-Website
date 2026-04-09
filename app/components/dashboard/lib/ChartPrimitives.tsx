'use client';

import { useId, useRef, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useTheme } from '@/app/components/ThemeProvider';
import { type ChartPalette, CHART_PALETTES, formatMonth } from './chart-utils';

/* ── useChartPalette ── */

export function useChartPalette(): ChartPalette {
  const { theme } = useTheme();
  return CHART_PALETTES[theme as 'dark' | 'light'] ?? CHART_PALETTES.dark;
}

/* ── useChartGradientId ── */

export function useChartGradientId(prefix: string): string {
  const id = useId();
  return `${prefix}-${id.replace(/:/g, '')}`;
}

/* ── ChartTooltip ── */

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
  c: ChartPalette;
  formatLabel?: (label: string) => string;
  formatValue?: (value: number, name: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  c,
  formatLabel,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-xl backdrop-blur-2xl"
      style={{
        background: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
      }}
    >
      <p
        className="m-0 mb-1.5 text-[10px] font-bold tracking-wide"
        style={{ color: c.tooltipLabel }}
      >
        {formatLabel ? formatLabel(label ?? '') : label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="my-0.5 text-xs font-bold"
          style={{ color: c.tooltipValue }}
        >
          {formatValue
            ? formatValue(entry.value, entry.name)
            : `$${Number(entry.value || 0).toLocaleString()}`}
          <span
            className="ml-1.5 text-[10px] font-semibold"
            style={{ color: c.tooltipSub }}
          >
            {entry.name}
          </span>
        </p>
      ))}
    </div>
  );
}

/* ── ChartContainer ── */

interface ChartContainerProps {
  children: React.ReactElement;
  height?: number;
}

export function ChartContainer({ children, height = 200 }: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        setDims({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    };
    const timer = setTimeout(measure, 50);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height, minWidth: 100, minHeight: height }}>
      {dims.w > 10 && dims.h > 10 && (
        <ResponsiveContainer width={dims.w} height={dims.h} minWidth={0} minHeight={1}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
