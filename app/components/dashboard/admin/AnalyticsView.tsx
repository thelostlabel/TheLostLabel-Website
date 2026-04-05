'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, TrendingUp, DollarSign,
    Activity, Users,
    ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area, ComposedChart, Bar, Line,
    PieChart, Pie, Cell, BarChart,
} from 'recharts';
import NextImage from 'next/image';
import { Button, Card, Separator, Skeleton, Table } from '@heroui/react';
import { useTheme } from '@/app/components/ThemeProvider';

/* ── Types ── */

interface AnalyticsSummary {
    totalGross: number;
    totalLabelRevenue: number;
    totalArtistShare: number;
    totalPayouts: number;
    unpaidBalance: number;
    avgMonthlyGross: number;
    lastMonthGross: number;
    monthOverMonthGrowth: number | null;
    totalArtists: number;
    revenuePerArtist: number;
}

interface RevenueTrendPoint {
    month: string;
    gross: number;
    labelRevenue: number;
    artistShare: number;
    expenses: number;
    growthPct: number | null;
}

interface RevenueVsPayoutPoint {
    month: string;
    gross: number;
    labelRevenue: number;
    payouts: number;
    netRetained: number;
}

interface PlatformData {
    source: string;
    gross: number;
    labelRevenue: number;
    streams: number;
    entries: number;
    share: number;
}

interface ListenerTrendPoint {
    month: string;
    peak: number;
    avg: number;
    artistCount: number;
    growthPct: number | null;
}

interface StreamTrendPoint {
    month: string;
    streams: number;
}

interface ForecastPoint {
    month: string;
    projected: number;
    isProjection: boolean;
}

interface PerArtistRevenue {
    artistId: string;
    artistName: string;
    artistImage: string | null;
    listeners: number;
    gross: number;
    labelRevenue: number;
    artistShare: number;
    streams: number;
    revenuePerListener: number;
}

interface AnalyticsData {
    summary: AnalyticsSummary;
    revenueTrend: RevenueTrendPoint[];
    revenueVsPayout: RevenueVsPayoutPoint[];
    platforms: PlatformData[];
    listenerTrend: ListenerTrendPoint[];
    streamTrend: StreamTrendPoint[];
    forecast: ForecastPoint[];
    perArtistRevenue: PerArtistRevenue[];
}

/* ── Helpers ── */

const compactNumber = (val: number): string => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
};

const formatMonth = (label: string): string => {
    if (!label) return '';
    const [year, month] = label.split('-');
    if (!year || !month) return label;
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const formatMonthShort = (label: string): string => {
    if (!label) return '';
    const [year, month] = label.split('-');
    if (!year || !month) return label;
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short' });
};

const FALLBACK_IMAGE = '/default-album.jpg';

const PLATFORM_COLORS: Record<string, string> = {
    SPOTIFY: '#1DB954',
    APPLE: '#FA243C',
    YOUTUBE: '#FF0000',
    AMAZON: '#FF9900',
    TIDAL: '#00A0FF',
    DEEZER: '#A238FF',
    TIKTOK: '#FE2C55',
};

const getPlatformColor = (source: string): string => {
    const upper = source.toUpperCase();
    for (const [key, color] of Object.entries(PLATFORM_COLORS)) {
        if (upper.includes(key)) return color;
    }
    return '#666';
};

/* ── Chart palette ── */
interface ChartPalette {
    accent: string;
    accentSoft: string;
    accentFill1: string;
    accentFill2: string;
    stroke: string;
    strokeSoft: string;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipLabel: string;
    tooltipValue: string;
    dotStroke: string;
    bar1: string;
    bar2: string;
    forecast: string;
    success: string;
    danger: string;
}

const PALETTES: Record<'dark' | 'light', ChartPalette> = {
    dark: {
        accent: '#a78bfa',
        accentSoft: 'rgba(167,139,250,0.35)',
        accentFill1: 'rgba(167,139,250,0.15)',
        accentFill2: 'rgba(167,139,250,0)',
        stroke: 'rgba(255,255,255,0.8)',
        strokeSoft: 'rgba(255,255,255,0.25)',
        grid: 'rgba(255,255,255,0.04)',
        tick: '#555',
        tooltipBg: 'rgba(8,8,12,0.95)',
        tooltipBorder: 'rgba(255,255,255,0.08)',
        tooltipLabel: '#777',
        tooltipValue: '#fff',
        dotStroke: '#0a0a0a',
        bar1: 'rgba(167,139,250,0.5)',
        bar2: 'rgba(255,255,255,0.12)',
        forecast: 'rgba(167,139,250,0.4)',
        success: 'rgba(34,197,94,0.65)',
        danger: 'rgba(239,68,68,0.65)',
    },
    light: {
        accent: '#7c3aed',
        accentSoft: 'rgba(124,58,237,0.3)',
        accentFill1: 'rgba(124,58,237,0.1)',
        accentFill2: 'rgba(124,58,237,0)',
        stroke: 'rgba(0,0,0,0.65)',
        strokeSoft: 'rgba(0,0,0,0.2)',
        grid: 'rgba(0,0,0,0.05)',
        tick: '#999',
        tooltipBg: 'rgba(255,255,255,0.97)',
        tooltipBorder: 'rgba(0,0,0,0.08)',
        tooltipLabel: '#999',
        tooltipValue: '#0a0a0a',
        dotStroke: '#fff',
        bar1: 'rgba(124,58,237,0.5)',
        bar2: 'rgba(0,0,0,0.1)',
        forecast: 'rgba(124,58,237,0.35)',
        success: 'rgba(22,163,74,0.7)',
        danger: 'rgba(220,38,38,0.7)',
    },
};

/* ── Shared components ── */

const GrowthBadge = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const isPositive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
};

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color?: string }>;
    label?: string;
    c: ChartPalette;
    formatValue?: (v: number, name: string) => string;
}

const ChartTooltipContent = ({ active, payload, label, c, formatValue }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-3.5 py-2.5 shadow-xl" style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, backdropFilter: 'blur(16px)' }}>
            <p className="text-[10px] font-bold mb-1.5 tracking-wide" style={{ color: c.tooltipLabel }}>
                {formatMonth(label ?? '')}
            </p>
            {payload.map((entry, i) => (
                <p key={i} className="text-xs font-bold my-0.5" style={{ color: c.tooltipValue }}>
                    {formatValue ? formatValue(entry.value, entry.name) : `$${Number(entry.value || 0).toLocaleString()}`}
                    <span className="ml-1.5 text-[10px] font-semibold" style={{ color: c.tooltipLabel }}>{entry.name}</span>
                </p>
            ))}
        </div>
    );
};

const CHART_HEIGHT = 240;
const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 4 };

/* ── Main component ── */

export default function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();
    const c = PALETTES[theme as 'dark' | 'light'] || PALETTES.dark;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/analytics');
            if (!res.ok) throw new Error('Failed to load analytics');
            setData(await res.json());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const forecastChartData = useMemo(() => {
        if (!data) return [];
        const actuals = data.revenueTrend.slice(-6).map((r) => ({
            month: r.month, actual: r.gross, projected: null as number | null,
        }));
        const projections = data.forecast.map((f) => ({
            month: f.month, actual: null as number | null, projected: f.projected,
        }));
        if (actuals.length > 0 && projections.length > 0) {
            projections.unshift({ month: actuals[actuals.length - 1].month, actual: null, projected: actuals[actuals.length - 1].actual });
        }
        return [...actuals, ...projections];
    }, [data]);

    /* ── Loading skeleton ── */
    if (loading) return (
        <div className="flex flex-col gap-4 pb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" animationType="shimmer" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Skeleton className="h-72 rounded-2xl" animationType="shimmer" />
                <Skeleton className="h-72 rounded-2xl" animationType="shimmer" />
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[11px] font-bold text-danger tracking-widest">{error || 'NO DATA'}</p>
            <Button variant="secondary" size="sm" onPress={fetchData}>RETRY</Button>
        </div>
    );

    const { summary } = data;

    const kpis = [
        { label: 'Total Gross', value: `$${compactNumber(summary.totalGross)}`, sub: `$${compactNumber(summary.avgMonthlyGross)} avg/mo`, icon: <DollarSign size={15} />, growth: summary.monthOverMonthGrowth },
        { label: 'Label Revenue', value: `$${compactNumber(summary.totalLabelRevenue)}`, sub: `${summary.totalGross > 0 ? ((summary.totalLabelRevenue / summary.totalGross) * 100).toFixed(0) : 0}% of gross`, icon: <TrendingUp size={15} />, growth: null },
        { label: 'Unpaid Balance', value: `$${compactNumber(summary.unpaidBalance)}`, sub: `$${compactNumber(summary.totalPayouts)} paid out`, icon: <Activity size={15} />, growth: null },
        { label: 'Revenue / Artist', value: `$${compactNumber(summary.revenuePerArtist)}`, sub: `${summary.totalArtists} artists`, icon: <Users size={15} />, growth: null },
    ];

    const xAxisProps = { tickFormatter: formatMonthShort, tick: { fill: c.tick, fontSize: 10, fontWeight: 600 }, axisLine: false, tickLine: false } as const;
    const gridProps = { strokeDasharray: "3 6", stroke: c.grid, vertical: false } as const;

    return (
        <div className="flex flex-col gap-4 pb-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black tracking-widest uppercase text-foreground">Analytics</h2>
                    <p className="mt-1 text-[11px] text-muted">Revenue, growth & forecasting</p>
                </div>
                <Button variant="secondary" size="sm" onPress={fetchData}>
                    <RefreshCw size={13} /> REFRESH
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                        <Card>
                            <Card.Content className="p-4 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-[0.16em] text-muted uppercase">{kpi.label}</span>
                                    <div className="text-muted/40">{kpi.icon}</div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black tracking-tight leading-none">{kpi.value}</span>
                                    {kpi.growth !== null && <GrowthBadge value={kpi.growth} />}
                                </div>
                                <span className="text-[10px] text-muted font-semibold">{kpi.sub}</span>
                            </Card.Content>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Row 1: Revenue vs Payouts + Forecast */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                    <Card.Header className="flex-row items-center justify-between">
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Revenue vs Payouts</Card.Title>
                    </Card.Header>
                    <Card.Content className="px-2 pb-3">
                        <div style={{ width: '100%', height: CHART_HEIGHT }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.revenueVsPayout.slice(-8)} margin={CHART_MARGIN}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c.accentFill1} />
                                            <stop offset="100%" stopColor={c.accentFill2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="month" {...xAxisProps} />
                                    <YAxis tickFormatter={(v: number) => `$${compactNumber(v)}`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                    <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `$${v.toLocaleString()}`} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="gross" name="Gross" stroke={c.accent} strokeWidth={2} fill="url(#revGrad)" dot={false} />
                                    <Bar dataKey="payouts" name="Payouts" fill={c.bar2} radius={[4, 4, 0, 0]} barSize={14} />
                                    <Line type="monotone" dataKey="netRetained" name="Net Retained" stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header className="flex-row items-center justify-between">
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Revenue Forecast</Card.Title>
                        {data.forecast.length > 0 && (
                            <span className="text-[10px] font-bold text-accent">
                                PROJ: ${compactNumber(data.forecast[data.forecast.length - 1]?.projected || 0)}
                            </span>
                        )}
                    </Card.Header>
                    <Card.Content className="px-2 pb-3">
                        <div style={{ width: '100%', height: CHART_HEIGHT }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastChartData} margin={CHART_MARGIN}>
                                    <defs>
                                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c.accentFill1} />
                                            <stop offset="100%" stopColor={c.accentFill2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="month" {...xAxisProps} />
                                    <YAxis tickFormatter={(v: number) => `$${compactNumber(v)}`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                    <Tooltip content={<ChartTooltipContent c={c} formatValue={(v, name) => `$${v.toLocaleString()} ${name === 'Projected' ? '(forecast)' : ''}`} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="actual" name="Actual" stroke={c.accent} strokeWidth={2} fill="url(#actualGrad)" dot={false} connectNulls={false} />
                                    <Area type="monotone" dataKey="projected" name="Projected" stroke={c.forecast} strokeWidth={2} strokeDasharray="6 4" fill="none" dot={{ r: 3, fill: c.forecast, stroke: c.dotStroke, strokeWidth: 2 }} connectNulls={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Content>
                </Card>
            </div>

            {/* Row 2: Platform + Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Platform Breakdown */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Platform Revenue</Card.Title>
                    </Card.Header>
                    <Card.Content className="flex items-start gap-6 flex-wrap px-4 pb-4">
                        <div className="relative" style={{ width: 170, height: 170 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.platforms}
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={72}
                                        paddingAngle={3}
                                        dataKey="gross" nameKey="source"
                                        strokeWidth={0}
                                    >
                                        {data.platforms.map((p, i) => (
                                            <Cell key={i} fill={getPlatformColor(p.source)} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0].payload as PlatformData;
                                            return (
                                                <div className="rounded-xl px-3 py-2 shadow-xl" style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}` }}>
                                                    <p className="text-xs font-bold" style={{ color: c.tooltipValue }}>{d.source}</p>
                                                    <p className="text-[11px] mt-0.5" style={{ color: c.tooltipLabel }}>${d.gross.toLocaleString()} ({d.share.toFixed(1)}%)</p>
                                                    {d.streams > 0 && <p className="text-[10px]" style={{ color: c.tooltipLabel }}>{d.streams.toLocaleString()} streams</p>}
                                                </div>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-lg font-black">{data.platforms.length}</span>
                                <span className="block text-[8px] font-bold text-muted tracking-wider">PLATFORMS</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5 min-w-[140px]">
                            {data.platforms.slice(0, 6).map((p, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <div className="size-2.5 rounded-sm shrink-0" style={{ background: getPlatformColor(p.source) }} />
                                    <span className="text-xs font-bold flex-1 truncate">{p.source}</span>
                                    <span className="text-[11px] font-bold text-muted">${compactNumber(p.gross)}</span>
                                    <span className="text-[10px] font-semibold text-muted/50 w-8 text-right">{p.share.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </Card.Content>
                </Card>

                {/* Growth Rate */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Monthly Growth Rate</Card.Title>
                    </Card.Header>
                    <Card.Content className="px-2 pb-3">
                        <div style={{ width: '100%', height: CHART_HEIGHT }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.revenueTrend.slice(-8).filter((r) => r.growthPct !== null)} margin={CHART_MARGIN}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="month" {...xAxisProps} />
                                    <YAxis tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                    <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />} cursor={{ fill: c.grid }} />
                                    <Bar dataKey="growthPct" name="Growth" radius={[6, 6, 0, 0]} barSize={22}>
                                        {data.revenueTrend.slice(-8).filter((r) => r.growthPct !== null).map((entry, i) => (
                                            <Cell key={i} fill={(entry.growthPct ?? 0) >= 0 ? c.success : c.danger} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Content>
                </Card>
            </div>

            {/* Row 3: Listener + Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                    <Card.Header>
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Listener Trend</Card.Title>
                    </Card.Header>
                    <Card.Content className="px-2 pb-3">
                        <div style={{ width: '100%', height: CHART_HEIGHT - 20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.listenerTrend.slice(-12)} margin={CHART_MARGIN}>
                                    <defs>
                                        <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c.accentFill1} />
                                            <stop offset="100%" stopColor={c.accentFill2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="month" {...xAxisProps} />
                                    <YAxis tickFormatter={(v: number) => compactNumber(v)} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                                    <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => v.toLocaleString()} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="avg" name="Avg Listeners" stroke={c.accent} strokeWidth={2} fill="url(#listenerGrad)" dot={false} />
                                    <Line type="monotone" dataKey="peak" name="Peak" stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Stream Volume</Card.Title>
                    </Card.Header>
                    <Card.Content className="px-2 pb-3">
                        <div style={{ width: '100%', height: CHART_HEIGHT - 20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.streamTrend.slice(-12)} margin={CHART_MARGIN}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="month" {...xAxisProps} />
                                    <YAxis tickFormatter={(v: number) => compactNumber(v)} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                                    <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `${v.toLocaleString()} streams`} />} cursor={{ fill: c.grid }} />
                                    <Bar dataKey="streams" name="Streams" fill={c.bar1} radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card.Content>
                </Card>
            </div>

            {/* Top Artists by Revenue */}
            <Card>
                <Card.Header className="flex-row items-center justify-between">
                    <Card.Title className="text-[10px] font-black tracking-[0.16em] uppercase text-muted">Top Artists by Revenue</Card.Title>
                    <span className="text-[10px] text-muted font-semibold">{data.perArtistRevenue.length} artists</span>
                </Card.Header>
                <Separator />
                <Table aria-label="Top Artists by Revenue">
                    <Table.ScrollContainer>
                        <Table.Content className="min-w-[700px]" selectionMode="none">
                            <Table.Header>
                                <Table.Column isRowHeader id="artist">ARTIST</Table.Column>
                                <Table.Column id="gross">GROSS</Table.Column>
                                <Table.Column id="label">LABEL</Table.Column>
                                <Table.Column id="artistShare">ARTIST SHARE</Table.Column>
                                <Table.Column id="streams">STREAMS</Table.Column>
                                <Table.Column id="listeners">LISTENERS</Table.Column>
                                <Table.Column id="rpl">$/LISTENER</Table.Column>
                            </Table.Header>
                            <Table.Body>
                                {data.perArtistRevenue.slice(0, 15).map((a, i) => (
                                    <Table.Row key={a.artistId} id={a.artistId}>
                                        <Table.Cell>
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-black text-muted/40 w-4">{i + 1}</span>
                                                <div className="size-7 rounded-md overflow-hidden bg-surface-secondary shrink-0">
                                                    <NextImage src={a.artistImage || FALLBACK_IMAGE} alt={a.artistName} width={28} height={28} unoptimized className="size-full object-cover" />
                                                </div>
                                                <span className="text-xs font-bold truncate">{a.artistName}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell><span className="text-xs font-bold">${a.gross.toLocaleString()}</span></Table.Cell>
                                        <Table.Cell><span className="text-xs font-semibold text-muted">${a.labelRevenue.toLocaleString()}</span></Table.Cell>
                                        <Table.Cell><span className="text-xs font-semibold text-muted">${a.artistShare.toLocaleString()}</span></Table.Cell>
                                        <Table.Cell><span className="text-xs font-semibold text-muted">{a.streams > 0 ? compactNumber(a.streams) : '--'}</span></Table.Cell>
                                        <Table.Cell><span className="text-xs font-semibold text-muted">{a.listeners > 0 ? compactNumber(a.listeners) : '--'}</span></Table.Cell>
                                        <Table.Cell>
                                            <span className={`text-xs font-bold ${a.revenuePerListener > 0 ? '' : 'text-muted'}`}>
                                                {a.revenuePerListener > 0 ? `$${a.revenuePerListener.toFixed(4)}` : '--'}
                                            </span>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>
            </Card>
        </div>
    );
}
