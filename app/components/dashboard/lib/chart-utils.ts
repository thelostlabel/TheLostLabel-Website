// ── Unified Chart Palette & Utilities ─────────────────────────────────────────
// Single source of truth for all dashboard chart styling, formatters, and colors.

/* ── ChartPalette type ── */

export interface ChartPalette {
  // Core strokes
  accent: string;
  accentSoft: string;
  stroke: string;
  strokeSoft: string;
  strokeFaint: string;

  // Gradient fills
  accentFill1: string;
  accentFill2: string;
  fillStop1: string;
  fillStop2: string;
  fillSoftStop1: string;

  // Grid & axis
  grid: string;
  tick: string;
  tickRight: string;
  cursor: string;

  // Dots
  dotStroke: string;

  // Tooltip
  tooltipBg: string;
  tooltipBorder: string;
  tooltipLabel: string;
  tooltipValue: string;
  tooltipSub: string;

  // Bars
  bar1: string;
  bar2: string;

  // Semantic
  forecast: string;
  success: string;
  danger: string;

  // Legend
  legendMain: string;
  legendSoft: string;
  legendFaint: string;
}

/* ── Palettes ── */

export const CHART_PALETTES: Record<'dark' | 'light', ChartPalette> = {
  dark: {
    accent: '#a78bfa',
    accentSoft: 'rgba(167,139,250,0.35)',
    stroke: 'rgba(255,255,255,0.75)',
    strokeSoft: 'rgba(255,255,255,0.28)',
    strokeFaint: 'rgba(255,255,255,0.12)',

    accentFill1: 'rgba(167,139,250,0.15)',
    accentFill2: 'rgba(167,139,250,0)',
    fillStop1: 'rgba(255,255,255,0.13)',
    fillStop2: 'rgba(255,255,255,0)',
    fillSoftStop1: 'rgba(255,255,255,0.06)',

    grid: 'rgba(255,255,255,0.04)',
    tick: '#555',
    tickRight: '#2a2a2a',
    cursor: 'rgba(255,255,255,0.06)',

    dotStroke: '#0a0a0a',

    tooltipBg: 'rgba(10,10,12,0.97)',
    tooltipBorder: 'rgba(255,255,255,0.09)',
    tooltipLabel: '#666',
    tooltipValue: '#fff',
    tooltipSub: '#555',

    bar1: 'rgba(167,139,250,0.5)',
    bar2: 'rgba(255,255,255,0.12)',

    forecast: 'rgba(167,139,250,0.4)',
    success: 'rgba(34,197,94,0.65)',
    danger: 'rgba(239,68,68,0.65)',

    legendMain: 'rgba(255,255,255,0.7)',
    legendSoft: 'rgba(255,255,255,0.28)',
    legendFaint: 'rgba(255,255,255,0.16)',
  },
  light: {
    accent: '#7c3aed',
    accentSoft: 'rgba(124,58,237,0.3)',
    stroke: 'rgba(0,0,0,0.65)',
    strokeSoft: 'rgba(0,0,0,0.25)',
    strokeFaint: 'rgba(0,0,0,0.1)',

    accentFill1: 'rgba(124,58,237,0.1)',
    accentFill2: 'rgba(124,58,237,0)',
    fillStop1: 'rgba(0,0,0,0.08)',
    fillStop2: 'rgba(0,0,0,0)',
    fillSoftStop1: 'rgba(0,0,0,0.04)',

    grid: 'rgba(0,0,0,0.05)',
    tick: '#999',
    tickRight: '#bbb',
    cursor: 'rgba(0,0,0,0.06)',

    dotStroke: '#fff',

    tooltipBg: 'rgba(255,255,255,0.97)',
    tooltipBorder: 'rgba(0,0,0,0.1)',
    tooltipLabel: '#999',
    tooltipValue: '#0a0a0a',
    tooltipSub: '#aaa',

    bar1: 'rgba(124,58,237,0.5)',
    bar2: 'rgba(0,0,0,0.1)',

    forecast: 'rgba(124,58,237,0.35)',
    success: 'rgba(22,163,74,0.7)',
    danger: 'rgba(220,38,38,0.7)',

    legendMain: 'rgba(0,0,0,0.65)',
    legendSoft: 'rgba(0,0,0,0.3)',
    legendFaint: 'rgba(0,0,0,0.15)',
  },
};

/* ── Platform colors ── */

export const PLATFORM_COLORS: Record<string, string> = {
  SPOTIFY: '#1DB954',
  APPLE: '#FA243C',
  YOUTUBE: '#FF0000',
  AMAZON: '#FF9900',
  TIDAL: '#00A0FF',
  DEEZER: '#A238FF',
  TIKTOK: '#FE2C55',
};

export function getPlatformColor(source: string): string {
  const upper = source.toUpperCase();
  for (const [key, color] of Object.entries(PLATFORM_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return '#666';
}

/* ── Formatters ── */

export function compactNumber(val: number | string): string {
  const num = Number(val) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
  return num.toLocaleString();
}

export function formatMonth(label: string): string {
  if (!label) return '';
  const [year, month] = label.split('-');
  if (!year || !month) return label;
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function formatMonthShort(label: string): string {
  if (!label || typeof label !== 'string') return '';
  const [year, month] = label.split('-');
  if (!year || !month) return label;
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return label;
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export function formatAxisDate(label: string, granularity: string): string {
  if (!label) return '';
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  if (granularity === 'monthly') return d.toLocaleDateString('en-US', { month: 'short' });
  if (granularity === 'weekly') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
