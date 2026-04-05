'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, FileAudio, GitPullRequest, FileText,
    Music2, Users, TrendingUp, BarChart3,
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area, ComposedChart, Line,
} from 'recharts';
import NextImage from 'next/image';
import { Card, Skeleton } from '@heroui/react';
import ActivityFeed from '@/app/components/dashboard/primitives/ActivityFeed';
import { useTheme } from '@/app/components/ThemeProvider';

/* ── Types & Interfaces ── */

interface ChartColorPalette {
    stroke:        string;
    strokeSoft:    string;
    strokeFaint:   string;
    fillStop1:     string;
    fillStop2:     string;
    fillSoftStop1: string;
    grid:          string;
    tick:          string;
    tickRight:     string;
    cursor:        string;
    dotStroke:     string;
    legendMain:    string;
    legendSoft:    string;
    legendFaint:   string;
    tooltipBg:     string;
    tooltipBorder: string;
    tooltipLabel:  string;
    tooltipValue:  string;
    tooltipSub:    string;
}

interface ListenerSeriesPoint {
    label:       string;
    value:       number;
    artistCount?: number;
    releaseCount?: number;
    avgPerArtist?: number;
}

interface RevenueSeriesPoint {
    label:       string;
    revenue:     number;
    artistShare: number;
}

interface RawListenerPoint {
    label: string;
    value: number | string;
    _date?: Date;
}

interface RawRevenuePoint {
    label:       string;
    revenue:     number | string;
    artistShare: number | string;
}

interface TopArtist {
    id?:               string | number;
    name:              string;
    image?:            string;
    monthlyListeners?: number;
}

interface TopRelease {
    id?:        string | number;
    name:       string;
    image?:     string;
    popularity?: number | string;
}

interface RecentDemo {
    id?:    string | number;
    title?: string;
    artist?: {
        stageName?: string;
        email?:     string;
    };
}

interface RecentRequest {
    id?:  string | number;
    type?: string;
    user?: {
        stageName?: string;
        email?:     string;
    };
}

interface PlatformPoint {
    label?: string;
    value?: number | string;
}

interface AdminStats {
    counts?: {
        pendingDemos?:     number;
        pendingRequests?:  number;
        pendingContracts?: number;
        listenersTotal?:   number;
        artists?:          number;
        releases?:         number;
        songs?:            number;
        albums?:           number;
        gross?:            number;
        revenue?:          number;
        payouts?:          number;
    };
    listenerTrends?: RawListenerPoint[];
    trends?:         RawRevenuePoint[];
    topArtists?:     TopArtist[];
    topReleases?:    TopRelease[];
    recent?: {
        demos?:    RecentDemo[];
        requests?: RecentRequest[];
    };
    platforms?: PlatformPoint[];
}

/* ── Formatters ── */
const compactNumber = (val: number | string): string => {
    const num = Number(val) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    return num.toLocaleString();
};

const FALLBACK_IMAGE = '/default-album.jpg';
const normalizeImageSrc = (src: unknown): string => {
    if (typeof src !== 'string') return FALLBACK_IMAGE;
    const t = src.trim();
    if (!t) return FALLBACK_IMAGE;
    if (/^https?:\/\//i.test(t)) return t;
    if (t.startsWith('/')) return t;
    return FALLBACK_IMAGE;
};
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = FALLBACK_IMAGE;
};

const formatAxisDate = (label: string, granularity: string): string => {
    if (!label) return '';
    const d = new Date(label);
    if (Number.isNaN(d.getTime())) return label;
    if (granularity === 'monthly') return d.toLocaleDateString('en-US', { month: 'short' });
    if (granularity === 'weekly') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatMonthLabel = (label: string): string => {
    if (!label || typeof label !== 'string') return '';
    const [year, month] = label.split('-');
    if (!year || !month) return label;
    const d = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(d.getTime())) return label;
    return d.toLocaleDateString('en-US', { month: 'short' });
};

const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
};

const aggregateListenerSeries = (data: RawListenerPoint[], granularity: string): ListenerSeriesPoint[] => {
    const normalized = (data || [])
        .map((item) => ({ ...item, _date: new Date(item.label) }))
        .filter((item) => !Number.isNaN(item._date.getTime()))
        .sort((a, b) => a._date.getTime() - b._date.getTime());

    if (granularity === 'daily') {
        return normalized.slice(-30).map((item) => ({ label: item._date.toISOString().slice(0, 10), value: Number(item.value || 0) }));
    }
    if (granularity === 'weekly') {
        const bucket = new Map<string, { sum: number; count: number }>();
        normalized.forEach((item) => {
            const weekStart = startOfWeek(item._date).toISOString().slice(0, 10);
            const prev = bucket.get(weekStart) || { sum: 0, count: 0 };
            bucket.set(weekStart, { sum: prev.sum + Number(item.value || 0), count: prev.count + 1 });
        });
        return Array.from(bucket.entries())
            .map(([label, v]) => ({ label, value: Math.round(v.sum / Math.max(v.count, 1)) }))
            .slice(-12);
    }
    const monthly = new Map<string, { _date: Date; value: number }>();
    normalized.forEach((item) => {
        const key = `${item._date.getFullYear()}-${String(item._date.getMonth() + 1).padStart(2, '0')}`;
        const prev = monthly.get(key);
        if (!prev || prev._date < item._date) monthly.set(key, { _date: item._date, value: Number(item.value || 0) });
    });
    return Array.from(monthly.entries())
        .map(([key, v]) => ({ label: `${key}-01`, value: v.value }))
        .slice(-12);
};

const aggregateRevenueSeries = (data: RawRevenuePoint[], granularity: string): RevenueSeriesPoint[] => {
    const monthly = (data || []).slice(-12).map((item) => ({
        label:       item.label,
        revenue:     Number(item.revenue || 0),
        artistShare: Number(item.artistShare || 0),
    }));
    if (granularity === 'monthly') return monthly;
    const quarterly = new Map<string, { revenue: number; artistShare: number }>();
    monthly.forEach((item) => {
        const [year, monthStr] = String(item.label).split('-');
        const quarter = Math.floor((Number(monthStr || 1) - 1) / 3) + 1;
        const key = `${year}-Q${quarter}`;
        const prev = quarterly.get(key) || { revenue: 0, artistShare: 0 };
        quarterly.set(key, { revenue: prev.revenue + item.revenue, artistShare: prev.artistShare + item.artistShare });
    });
    return Array.from(quarterly.entries()).map(([label, v]) => ({ label, ...v }));
};

/* ── Theme-aware chart color palettes ── */
const CHART_COLORS: Record<'dark' | 'light', ChartColorPalette> = {
    dark: {
        stroke:        'rgba(255,255,255,0.75)',
        strokeSoft:    'rgba(255,255,255,0.28)',
        strokeFaint:   'rgba(255,255,255,0.12)',
        fillStop1:     'rgba(255,255,255,0.13)',
        fillStop2:     'rgba(255,255,255,0)',
        fillSoftStop1: 'rgba(255,255,255,0.06)',
        grid:          'rgba(255,255,255,0.035)',
        tick:          '#555',
        tickRight:     '#2a2a2a',
        cursor:        'rgba(255,255,255,0.06)',
        dotStroke:     '#0a0a0a',
        legendMain:    'rgba(255,255,255,0.7)',
        legendSoft:    'rgba(255,255,255,0.28)',
        legendFaint:   'rgba(255,255,255,0.16)',
        tooltipBg:     'rgba(10,10,12,0.97)',
        tooltipBorder: 'rgba(255,255,255,0.09)',
        tooltipLabel:  '#666',
        tooltipValue:  '#fff',
        tooltipSub:    '#555',
    },
    light: {
        stroke:        'rgba(0,0,0,0.65)',
        strokeSoft:    'rgba(0,0,0,0.25)',
        strokeFaint:   'rgba(0,0,0,0.1)',
        fillStop1:     'rgba(0,0,0,0.08)',
        fillStop2:     'rgba(0,0,0,0)',
        fillSoftStop1: 'rgba(0,0,0,0.04)',
        grid:          'rgba(0,0,0,0.05)',
        tick:          '#999',
        tickRight:     '#bbb',
        cursor:        'rgba(0,0,0,0.06)',
        dotStroke:     '#f2f2f4',
        legendMain:    'rgba(0,0,0,0.65)',
        legendSoft:    'rgba(0,0,0,0.3)',
        legendFaint:   'rgba(0,0,0,0.15)',
        tooltipBg:     'rgba(255,255,255,0.97)',
        tooltipBorder: 'rgba(0,0,0,0.1)',
        tooltipLabel:  '#999',
        tooltipValue:  '#0a0a0a',
        tooltipSub:    '#aaa',
    },
};

/* ── Responsive chart wrapper ── */
interface ChartContainerProps {
    children: React.ReactElement;
    height?: number;
}

const ChartContainer = ({ children, height = 200 }: ChartContainerProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const measure = () => {
            const rect = node.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 10) setDims({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
        };
        const timer = setTimeout(measure, 50);
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(measure);
            observer.observe(node);
            return () => { clearTimeout(timer); observer.disconnect(); };
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
};

interface TooltipPayloadEntry {
    value: number;
    name:  string;
}

interface ChartTooltipProps {
    active?:      boolean;
    payload?:     TooltipPayloadEntry[];
    label?:       string;
    formatLabel?: (label: string) => string;
    formatValue?: (value: number, name: string) => string;
    c:            ChartColorPalette;
}

const ChartTooltip = ({ active, payload, label, formatLabel, formatValue, c }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: c.tooltipLabel, letterSpacing: '0.5px', marginBottom: 6 }}>
                {formatLabel ? formatLabel(label ?? '') : label}
            </p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: 12, fontWeight: 800, color: c.tooltipValue }}>
                    {formatValue ? formatValue(entry.value, entry.name) : entry.value}
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.tooltipSub }}>{entry.name}</span>
                </p>
            ))}
        </div>
    );
};

/* ── Charts ── */
interface ListenerScaleChartProps {
    data:         ListenerSeriesPoint[];
    height?:      number;
    granularity?: string;
    c:            ChartColorPalette;
}

const ListenerScaleChart = ({ data, height = 180, granularity = 'daily', c }: ListenerScaleChartProps) => {
    const tickCount = granularity === 'daily' ? 6 : granularity === 'weekly' ? 6 : undefined;
    return (
        <ChartContainer height={height}>
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                <defs>
                    <linearGradient id="listenerFillMono" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.fillStop1} stopOpacity={1} />
                        <stop offset="100%" stopColor={c.fillStop2} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" tickFormatter={(v) => formatAxisDate(v, granularity)} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" tickCount={tickCount} />
                <YAxis yAxisId="listeners" tickFormatter={compactNumber} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="counts" orientation="right" allowDecimals={false} tick={{ fill: c.tickRight, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip formatLabel={(v) => formatAxisDate(v, granularity)} formatValue={(v) => Number(v || 0).toLocaleString()} c={c} />} cursor={{ stroke: c.cursor, strokeWidth: 1 }} />
                <Area yAxisId="listeners" type="monotone" dataKey="value" name="Monthly Listeners" stroke={c.stroke} strokeWidth={1.5} fill="url(#listenerFillMono)" dot={false} activeDot={{ r: 4, fill: c.stroke, stroke: c.dotStroke, strokeWidth: 2 }} />
                <Line yAxisId="listeners" type="monotone" dataKey="avgPerArtist" name="Per Artist" stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                <Line yAxisId="counts" type="monotone" dataKey="artistCount" name="Artists" stroke={c.strokeFaint} strokeWidth={1} dot={false} />
                <Line yAxisId="counts" type="monotone" dataKey="releaseCount" name="Releases" stroke={c.strokeFaint} strokeWidth={1} dot={false} />
            </ComposedChart>
        </ChartContainer>
    );
};

interface RevenueFlowChartProps {
    data:         RevenueSeriesPoint[];
    height?:      number;
    granularity?: string;
    c:            ChartColorPalette;
}

const RevenueFlowChart = ({ data, height = 180, granularity = 'monthly', c }: RevenueFlowChartProps) => (
    <ChartContainer height={height}>
        <AreaChart data={(data || []).slice(-8)} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
            <defs>
                <linearGradient id="revFillMono" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.fillStop1} stopOpacity={1} />
                    <stop offset="100%" stopColor={c.fillStop2} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="artFillMono" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.fillSoftStop1} stopOpacity={1} />
                    <stop offset="100%" stopColor={c.fillStop2} stopOpacity={1} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
            <XAxis dataKey="label" tickFormatter={(v) => (granularity === 'quarterly' ? String(v).replace('-', ' ') : formatMonthLabel(v))} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tickFormatter={compactNumber} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTooltip formatLabel={(v) => (granularity === 'quarterly' ? String(v).replace('-', ' ') : formatMonthLabel(v))} formatValue={(v) => `$${Number(v || 0).toLocaleString()}`} c={c} />} cursor={{ stroke: c.cursor, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="artistShare" name="Artist Share" stroke={c.strokeSoft} strokeWidth={1} fill="url(#artFillMono)" dot={false} activeDot={{ r: 4, fill: c.strokeSoft, stroke: c.dotStroke, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="revenue" name="Label Revenue" stroke={c.stroke} strokeWidth={1.5} fill="url(#revFillMono)" dot={false} activeDot={{ r: 4, fill: c.stroke, stroke: c.dotStroke, strokeWidth: 2 }} />
        </AreaChart>
    </ChartContainer>
);

/* ── PillToggle ── */
interface PillOption {
    key:   string;
    label: string;
}

interface PillToggleProps {
    options:  PillOption[];
    value:    string;
    onChange: (key: string) => void;
}

const PillToggle = ({ options, value, onChange }: PillToggleProps) => (
    <div className="inline-flex gap-0.5 rounded-lg border border-default/15 bg-default/5 p-0.5">
        {options.map((opt) => {
            const active = value === opt.key;
            return (
                <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChange(opt.key)}
                    className={[
                        'border-0 rounded-md px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors',
                        active ? 'bg-default/15 text-foreground' : 'bg-transparent text-muted hover:text-foreground',
                    ].join(' ')}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

/* ── Chart legend ── */
interface LegendItem {
    color:   string;
    label:   string;
    dashed?: boolean;
    line?:   boolean;
}

interface LegendProps {
    items: LegendItem[];
}

const Legend = ({ items }: LegendProps) => (
    <div className="flex flex-wrap gap-3 items-center mt-2.5">
        {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
                {item.dashed
                    ? <span style={{ width: 12, height: 0, borderTop: `1.5px dashed ${item.color}` }} />
                    : item.line
                    ? <span style={{ width: 12, height: 1.5, borderRadius: 1, background: item.color }} />
                    : <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />}
                <span style={{ fontSize: 10, fontWeight: 600, color: item.color }}>{item.label}</span>
            </div>
        ))}
    </div>
);

/* ── KPI Card ── */
interface KpiCardProps {
    label: string;
    value: number | string;
    sub:   string;
    icon:  React.ReactNode;
    badge?: string;
}

const KpiCard = ({ label, value, sub, icon, badge }: KpiCardProps) => (
    <Card className="p-0">
        <Card.Content className="p-4 gap-0">
            <div className="flex items-center justify-between mb-3">
                <p className="m-0 text-[9px] font-extrabold tracking-[0.18em] uppercase text-muted">{label}</p>
                <div className="text-muted/50">{icon}</div>
            </div>
            <p className="m-0 text-[28px] font-black text-foreground leading-none tracking-tight">{compactNumber(value)}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="m-0 text-[11px] text-muted font-semibold">{sub}</p>
                {badge && (
                    <span className="text-[9px] font-extrabold tracking-wide uppercase text-muted bg-default/8 px-1.5 py-0.5 rounded-md">
                        {badge}
                    </span>
                )}
            </div>
        </Card.Content>
    </Card>
);

/* ── Action Queue item ── */
interface QueueItemProps {
    label:   string;
    count:   number;
    icon:    React.ReactNode;
    onClick: () => void;
}

const QueueItem = ({ label, count, icon, onClick }: QueueItemProps) => {
    const hasItems = count > 0;
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-2.5 bg-transparent border-0 border-b border-default/8 py-2.5 cursor-pointer text-left hover:opacity-75 transition-opacity"
        >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasItems ? 'bg-danger' : 'bg-success'}`} />
            <div className="text-muted/50 shrink-0">{icon}</div>
            <p className={`m-0 flex-1 text-[12px] font-bold ${hasItems ? 'text-foreground' : 'text-muted'}`}>{label}</p>
            <span className={`text-[13px] font-black shrink-0 ${hasItems ? 'text-foreground' : 'text-muted/40'}`}>{count}</span>
        </button>
    );
};

/* ── Recent activity row ── */
interface RecentItemProps {
    name:    string;
    sub?:    string;
    onClick: () => void;
}

const RecentItem = ({ name, sub, onClick }: RecentItemProps) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-2.5 bg-transparent border-0 border-b border-default/6 py-1.5 cursor-pointer text-left hover:opacity-70 transition-opacity"
    >
        <div className="flex-1 overflow-hidden">
            <p className="m-0 text-[12px] font-bold text-foreground/70 truncate">{name}</p>
            {sub && <p className="m-0 mt-px text-[10px] text-muted font-semibold">{sub}</p>}
        </div>
    </button>
);

/* ── Rank color ── */
const rankClass = (i: number): string =>
    i === 0 ? 'text-foreground' : i === 1 ? 'text-foreground/60' : i === 2 ? 'text-foreground/40' : 'text-muted/40';

/* ── Section label ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="m-0 mb-2.5 text-[9px] font-extrabold tracking-[0.2em] uppercase text-muted/60">{children}</p>
);

/* ── Stat mini-box ── */
interface StatBoxProps {
    label: string;
    value: string | number;
}

const StatBox = ({ label, value }: StatBoxProps) => (
    <div className="rounded-lg border border-default/10 bg-default/5 p-2">
        <p className="m-0 text-[8px] font-extrabold tracking-[0.1em] uppercase text-muted">{label}</p>
        <p className="m-0 mt-0.5 text-[13px] font-black text-foreground">{value}</p>
    </div>
);

/* ── Main component ── */
interface HomeViewProps {
    onNavigate: (view: string) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [listenerGranularity, setListenerGranularity] = useState<string>('daily');
    const [revenueGranularity, setRevenueGranularity] = useState<string>('monthly');
    const { theme } = useTheme();
    const c: ChartColorPalette = CHART_COLORS[theme as 'dark' | 'light'] || CHART_COLORS.dark;

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async (): Promise<void> => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const listenerSeriesData = useMemo(
        () => aggregateListenerSeries(stats?.listenerTrends || [], listenerGranularity),
        [stats?.listenerTrends, listenerGranularity],
    );
    const revenueSeriesData = useMemo(
        () => aggregateRevenueSeries(stats?.trends || [], revenueGranularity),
        [stats?.trends, revenueGranularity],
    );

    const latestListeners = listenerSeriesData.at(-1)?.value || 0;
    const prevListeners = listenerSeriesData.at(-2)?.value || 0;
    const listenerDeltaPct = prevListeners > 0 ? ((latestListeners - prevListeners) / prevListeners) * 100 : 0;
    const compareSeriesData: ListenerSeriesPoint[] = listenerSeriesData.map((point) => ({
        ...point,
        artistCount:  Number(stats?.counts?.artists || 0),
        releaseCount: Number(stats?.counts?.releases || 0),
        avgPerArtist: Number(stats?.counts?.artists || 0) > 0 ? Math.round(Number(point.value || 0) / Number(stats?.counts?.artists || 0)) : 0,
    }));

    /* ── Loading skeleton ── */
    if (loading) return (
        <div style={{ padding: '0 0 40px 0' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="w-20 h-2 bg-default/10 rounded mb-2" />
                    <div className="w-40 h-4 bg-default/6 rounded" />
                </div>
            </div>
            <div className="home-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                    <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.08 }}>
                        <Skeleton className="h-24 rounded-[14px]" animationType="shimmer" />
                    </motion.div>
                ))}
            </div>
            <div className="home-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 10, alignItems: 'start' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                    <Skeleton className="h-64 rounded-[14px]" animationType="shimmer" />
                    <Skeleton className="h-64 rounded-[14px]" animationType="shimmer" />
                </div>
                <Skeleton className="h-96 rounded-[14px]" animationType="shimmer" />
            </div>
        </div>
    );

    if (!stats) return null;

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const pendingDemos     = Number(stats.counts?.pendingDemos || 0);
    const pendingRequests  = Number(stats.counts?.pendingRequests || 0);
    const pendingContracts = Number(stats.counts?.pendingContracts || 0);
    const totalPending     = pendingDemos + pendingRequests + pendingContracts;

    return (
        <div style={{ padding: '0 0 48px 0' }}>

            {/* ── Compact Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between mb-5"
            >
                <div>
                    <p className="m-0 text-[9px] font-extrabold tracking-[0.22em] uppercase text-muted/60">Admin Overview</p>
                    <p className="m-0 mt-1 text-[14px] font-bold text-foreground/50 tracking-tight">{today}</p>
                </div>
                <div className="flex items-center gap-3">
                    {totalPending > 0 && (
                        <div className="flex items-center gap-1.5 bg-danger/8 border border-danger/20 rounded-lg px-2.5 py-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                            <span className="text-[11px] font-bold text-danger">{totalPending} pending</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={fetchStats}
                        className="flex items-center gap-1.5 bg-default/5 border border-default/10 rounded-lg px-3 py-1.5 cursor-pointer text-muted text-[11px] font-bold hover:bg-default/10 hover:text-foreground transition-colors"
                    >
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* ── KPI Row ── */}
            <div className="home-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                    { label: 'Monthly Listeners', value: stats.counts?.listenersTotal || 0, sub: 'All artists combined', icon: <BarChart3 size={14} />, badge: `${Number(stats.counts?.artists || 0)} artists` },
                    { label: 'Gross Revenue', value: stats.counts?.gross || 0, sub: `$${compactNumber(stats.counts?.revenue || 0)} label · $${compactNumber(stats.counts?.payouts || 0)} payouts`, icon: <TrendingUp size={14} /> },
                    { label: 'Total Artists', value: Number(stats.counts?.artists || 0), sub: 'Signed profiles', icon: <Users size={14} />, badge: `${Number(stats.counts?.releases || 0)} releases` },
                    { label: 'Catalog', value: Number(stats.counts?.songs || 0), sub: `${Number(stats.counts?.releases || 0)} releases · ${Number(stats.counts?.albums || 0)} albums`, icon: <Music2 size={14} /> },
                ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}>
                        <KpiCard {...card} />
                    </motion.div>
                ))}
            </div>

            {/* ── Main Grid: Charts + Action Queue ── */}
            <div className="home-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 10, alignItems: 'start' }}>

                {/* Left: charts + leaderboards */}
                <div style={{ display: 'grid', gap: 10 }}>

                    {/* Revenue Flow */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
                        <Card className="p-0">
                            <Card.Content className="p-[18px] pb-3.5 gap-0">
                                <div className="flex items-start justify-between gap-3 mb-3.5">
                                    <div>
                                        <SectionLabel>Revenue Flow</SectionLabel>
                                        <p className="m-0 text-[26px] font-black text-foreground leading-none tracking-tight">
                                            ${compactNumber(stats.counts?.gross || 0)}
                                        </p>
                                        <p className="m-0 mt-1 text-[11px] text-muted font-semibold">Gross earnings</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="flex gap-2">
                                            <StatBox label="Payouts" value={`$${compactNumber(stats.counts?.payouts || 0)}`} />
                                            <StatBox label="Label" value={`$${compactNumber(stats.counts?.revenue || 0)}`} />
                                        </div>
                                        <PillToggle
                                            options={[{ key: 'monthly', label: 'Monthly' }, { key: 'quarterly', label: 'Quarterly' }]}
                                            value={revenueGranularity}
                                            onChange={setRevenueGranularity}
                                        />
                                    </div>
                                </div>
                                <RevenueFlowChart data={revenueSeriesData} height={160} granularity={revenueGranularity} c={c} />
                                <Legend items={[
                                    { color: c.legendMain, label: 'Label Revenue' },
                                    { color: c.legendSoft, label: 'Artist Share', dashed: true },
                                ]} />
                            </Card.Content>
                        </Card>
                    </motion.div>

                    {/* Listener Scale */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}>
                        <Card className="p-0">
                            <Card.Content className="p-[18px] pb-3.5 gap-0">
                                <div className="flex items-start justify-between gap-3 mb-3.5">
                                    <div>
                                        <SectionLabel>Listener Scale</SectionLabel>
                                        <p className="m-0 text-[26px] font-black text-foreground leading-none tracking-tight">{latestListeners.toLocaleString()}</p>
                                        <p className={`m-0 mt-1 text-[11px] font-bold ${listenerDeltaPct >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {listenerDeltaPct >= 0 ? '+' : ''}{listenerDeltaPct.toFixed(1)}% vs previous
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {[
                                                { label: 'Artists', value: Number(stats.counts?.artists || 0).toLocaleString() },
                                                { label: 'Releases', value: Number(stats.counts?.releases || 0).toLocaleString() },
                                                { label: 'Per Artist', value: (Number(stats.counts?.artists || 0) ? Math.round(latestListeners / Number(stats.counts?.artists || 0)) : 0).toLocaleString() },
                                            ].map((s) => (
                                                <StatBox key={s.label} label={s.label} value={s.value} />
                                            ))}
                                        </div>
                                        <PillToggle
                                            options={[{ key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }]}
                                            value={listenerGranularity}
                                            onChange={setListenerGranularity}
                                        />
                                    </div>
                                </div>
                                <ListenerScaleChart data={compareSeriesData} height={160} granularity={listenerGranularity} c={c} />
                                <Legend items={[
                                    { color: c.legendMain, label: 'Monthly Listeners' },
                                    { color: c.legendSoft, label: 'Per Artist', dashed: true },
                                    { color: c.legendFaint, label: 'Artist Count', line: true },
                                ]} />
                            </Card.Content>
                        </Card>
                    </motion.div>

                    {/* Leaderboard Row */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                        <div className="home-leaderboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

                            {/* Top Artists */}
                            <Card className="p-0">
                                <Card.Content className="p-[18px] gap-0">
                                    <div className="flex items-center justify-between mb-3.5">
                                        <SectionLabel>Top Artists</SectionLabel>
                                        <button
                                            type="button"
                                            onClick={() => onNavigate('artists')}
                                            className="text-[10px] font-bold text-muted bg-transparent border-0 cursor-pointer tracking-wide hover:text-foreground transition-colors"
                                        >
                                            VIEW ALL →
                                        </button>
                                    </div>
                                    <div className="grid gap-1.5">
                                        {(stats.topArtists || []).slice(0, 5).map((a, i) => (
                                            <button
                                                key={a.id || i}
                                                type="button"
                                                onClick={() => onNavigate('artists')}
                                                className="w-full bg-default/4 border border-default/8 rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-left hover:bg-default/8 transition-colors"
                                            >
                                                <div className="w-[30px] h-[30px] rounded-lg overflow-hidden shrink-0 bg-default/10 border border-default/10">
                                                    <NextImage src={normalizeImageSrc(a.image)} alt={a.name || 'Artist'} width={30} height={30} unoptimized onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="m-0 text-[12px] font-extrabold text-foreground truncate">{a.name}</p>
                                                    <p className="m-0 mt-px text-[10px] text-muted font-semibold">{(a.monthlyListeners || 0).toLocaleString()}</p>
                                                </div>
                                                <span className={`text-[9px] font-black shrink-0 ${rankClass(i)}`}>#{i + 1}</span>
                                            </button>
                                        ))}
                                        {(!stats.topArtists || stats.topArtists.length === 0) && (
                                            <p className="m-0 text-[11px] text-muted/50">No data.</p>
                                        )}
                                    </div>
                                </Card.Content>
                            </Card>

                            {/* Top Releases */}
                            <Card className="p-0">
                                <Card.Content className="p-[18px] gap-0">
                                    <div className="flex items-center justify-between mb-3.5">
                                        <SectionLabel>Top Releases</SectionLabel>
                                        <button
                                            type="button"
                                            onClick={() => onNavigate('releases')}
                                            className="text-[10px] font-bold text-muted bg-transparent border-0 cursor-pointer tracking-wide hover:text-foreground transition-colors"
                                        >
                                            VIEW ALL →
                                        </button>
                                    </div>
                                    <div className="grid gap-1.5">
                                        {(stats.topReleases || []).slice(0, 5).map((r, i) => (
                                            <button
                                                key={r.id || i}
                                                type="button"
                                                onClick={() => onNavigate('releases')}
                                                className="w-full bg-default/4 border border-default/8 rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 cursor-pointer text-left hover:bg-default/8 transition-colors"
                                            >
                                                <div className="w-[30px] h-[30px] rounded-lg overflow-hidden shrink-0 bg-default/10 border border-default/10">
                                                    <NextImage src={normalizeImageSrc(r.image)} alt={r.name || 'Release'} width={30} height={30} unoptimized onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="m-0 text-[12px] font-extrabold text-foreground truncate">{r.name}</p>
                                                    <p className="m-0 mt-px text-[10px] text-muted font-semibold">
                                                        {r.popularity ? `${r.popularity} popularity` : 'No stream data'}
                                                    </p>
                                                </div>
                                                <span className={`text-[9px] font-black shrink-0 ${rankClass(i)}`}>#{i + 1}</span>
                                            </button>
                                        ))}
                                        {(!stats.topReleases || stats.topReleases.length === 0) && (
                                            <p className="m-0 text-[11px] text-muted/50">No data.</p>
                                        )}
                                    </div>
                                </Card.Content>
                            </Card>
                        </div>
                    </motion.div>
                </div>

                {/* Right: Action Queue */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ position: 'sticky', top: 16 }}
                >
                    <Card className="p-0">
                        <Card.Content className="p-[18px] gap-0">

                            {/* Needs Attention */}
                            <SectionLabel>Needs Attention</SectionLabel>
                            <div className="mb-5">
                                <QueueItem label="Demo Submissions" count={pendingDemos} icon={<FileAudio size={13} />} onClick={() => onNavigate('submissions')} />
                                <QueueItem label="Change Requests" count={pendingRequests} icon={<GitPullRequest size={13} />} onClick={() => onNavigate('requests')} />
                                <QueueItem label="Unsigned Contracts" count={pendingContracts} icon={<FileText size={13} />} onClick={() => onNavigate('contracts')} />
                            </div>

                            {/* Recent Demos */}
                            {(stats.recent?.demos || []).length > 0 && (
                                <>
                                    <SectionLabel>Recent Demos</SectionLabel>
                                    <div className="mb-5">
                                        {(stats.recent!.demos || []).slice(0, 4).map((d, i) => (
                                            <RecentItem
                                                key={d.id || i}
                                                name={d.title || 'Untitled'}
                                                sub={d.artist?.stageName || d.artist?.email || ''}
                                                onClick={() => onNavigate('submissions')}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Recent Requests */}
                            {(stats.recent?.requests || []).length > 0 && (
                                <>
                                    <SectionLabel>Recent Requests</SectionLabel>
                                    <div>
                                        {(stats.recent!.requests || []).slice(0, 4).map((r, i) => (
                                            <RecentItem
                                                key={r.id || i}
                                                name={r.type ? String(r.type).replace(/_/g, ' ') : 'Request'}
                                                sub={r.user?.stageName || r.user?.email || ''}
                                                onClick={() => onNavigate('requests')}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Platform summary */}
                            {(stats.platforms || []).length > 0 && (
                                <div className="border-t border-default/8 mt-4 pt-4">
                                    <SectionLabel>Top Platform</SectionLabel>
                                    <p className="m-0 text-[15px] font-black text-foreground">{stats.platforms![0]?.label || 'N/A'}</p>
                                    <p className="m-0 mt-1 text-[11px] text-muted font-semibold">${Number(stats.platforms![0]?.value || 0).toLocaleString()} label revenue</p>
                                </div>
                            )}

                            {/* Activity Feed */}
                            <div className="border-t border-default/8 mt-4 pt-4">
                                <SectionLabel>Activity Feed</SectionLabel>
                                <div className="-mx-4 mt-2">
                                    <ActivityFeed limit={8} />
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>
            </div>

            <style jsx>{`
                @media (max-width: 1180px) {
                    .home-main-grid { grid-template-columns: 1fr !important; }
                    .home-leaderboard-grid { grid-template-columns: 1fr 1fr !important; }
                }
                @media (max-width: 820px) {
                    .home-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .home-leaderboard-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 540px) {
                    .home-kpi-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
