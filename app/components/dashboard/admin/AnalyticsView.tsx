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
import { Card, Skeleton } from '@heroui/react';
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

/* ── Chart colors ── */
interface ChartPalette {
    stroke: string;
    strokeSoft: string;
    strokeFaint: string;
    fillStop1: string;
    fillStop2: string;
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
}

const PALETTES: Record<'dark' | 'light', ChartPalette> = {
    dark: {
        stroke: 'rgba(255,255,255,0.75)',
        strokeSoft: 'rgba(255,255,255,0.28)',
        strokeFaint: 'rgba(255,255,255,0.12)',
        fillStop1: 'rgba(255,255,255,0.10)',
        fillStop2: 'rgba(255,255,255,0)',
        grid: 'rgba(255,255,255,0.035)',
        tick: '#555',
        tooltipBg: 'rgba(10,10,12,0.97)',
        tooltipBorder: 'rgba(255,255,255,0.09)',
        tooltipLabel: '#666',
        tooltipValue: '#fff',
        dotStroke: '#0a0a0a',
        bar1: 'rgba(255,255,255,0.55)',
        bar2: 'rgba(255,255,255,0.18)',
        forecast: 'rgba(255,255,255,0.35)',
    },
    light: {
        stroke: 'rgba(0,0,0,0.65)',
        strokeSoft: 'rgba(0,0,0,0.25)',
        strokeFaint: 'rgba(0,0,0,0.1)',
        fillStop1: 'rgba(0,0,0,0.08)',
        fillStop2: 'rgba(0,0,0,0)',
        grid: 'rgba(0,0,0,0.05)',
        tick: '#999',
        tooltipBg: 'rgba(255,255,255,0.97)',
        tooltipBorder: 'rgba(0,0,0,0.1)',
        tooltipLabel: '#999',
        tooltipValue: '#0a0a0a',
        dotStroke: '#f2f2f4',
        bar1: 'rgba(0,0,0,0.55)',
        bar2: 'rgba(0,0,0,0.18)',
        forecast: 'rgba(0,0,0,0.25)',
    },
};

/* ── Shared components ── */

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="m-0 mb-2.5 text-[9px] font-extrabold tracking-[0.2em] uppercase text-muted/60">{children}</p>
);

const GrowthBadge = ({ value }: { value: number | null }) => {
    if (value === null) return <span className="text-[10px] text-muted">--</span>;
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
        <div style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: c.tooltipLabel, letterSpacing: '0.5px', marginBottom: 6 }}>
                {formatMonth(label ?? '')}
            </p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: 12, fontWeight: 800, color: c.tooltipValue }}>
                    {formatValue ? formatValue(entry.value, entry.name) : `$${Number(entry.value || 0).toLocaleString()}`}
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.tooltipLabel }}>{entry.name}</span>
                </p>
            ))}
        </div>
    );
};

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

    // Forecast chart: merge actual + projected
    const forecastChartData = useMemo(() => {
        if (!data) return [];
        const actuals = data.revenueTrend.slice(-6).map((r) => ({
            month: r.month,
            actual: r.gross,
            projected: null as number | null,
        }));
        const projections = data.forecast.map((f) => ({
            month: f.month,
            actual: null as number | null,
            projected: f.projected,
        }));
        // Bridge: last actual also starts the projection line
        if (actuals.length > 0 && projections.length > 0) {
            projections.unshift({
                month: actuals[actuals.length - 1].month,
                actual: null,
                projected: actuals[actuals.length - 1].actual,
            });
        }
        return [...actuals, ...projections];
    }, [data]);

    /* ── Loading skeleton ── */
    if (loading) return (
        <div style={{ padding: '0 0 40px 0' }}>
            <div className="flex items-center justify-between mb-5">
                <div className="w-40 h-4 bg-default/6 rounded" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                    <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.08 }}>
                        <Skeleton className="h-24 rounded-[14px]" animationType="shimmer" />
                    </motion.div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Skeleton className="h-72 rounded-[14px]" animationType="shimmer" />
                <Skeleton className="h-72 rounded-[14px]" animationType="shimmer" />
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[11px] font-bold text-danger tracking-widest">{error || 'NO DATA'}</p>
            <button type="button" onClick={fetchData} className="text-[10px] font-bold text-muted bg-default/5 border border-default/10 rounded-lg px-4 py-2 cursor-pointer hover:text-foreground transition-colors">
                RETRY
            </button>
        </div>
    );

    const { summary } = data;

    return (
        <div style={{ padding: '0 0 48px 0' }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-between mb-5">
                <div>
                    <p className="m-0 text-[9px] font-extrabold tracking-[0.22em] uppercase text-muted/60">Analytics</p>
                    <p className="m-0 mt-1 text-[14px] font-bold text-foreground/50 tracking-tight">Revenue, growth & forecasting</p>
                </div>
                <button type="button" onClick={fetchData} className="flex items-center gap-1.5 bg-default/5 border border-default/10 rounded-lg px-3 py-1.5 cursor-pointer text-muted text-[11px] font-bold hover:bg-default/10 hover:text-foreground transition-colors">
                    <RefreshCw size={12} />
                    Refresh
                </button>
            </motion.div>

            {/* KPI Row */}
            <div className="analytics-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                    {
                        label: 'Total Gross',
                        value: `$${compactNumber(summary.totalGross)}`,
                        sub: `$${compactNumber(summary.avgMonthlyGross)} avg/mo`,
                        icon: <DollarSign size={14} />,
                        growth: summary.monthOverMonthGrowth,
                    },
                    {
                        label: 'Label Revenue',
                        value: `$${compactNumber(summary.totalLabelRevenue)}`,
                        sub: `${summary.totalGross > 0 ? ((summary.totalLabelRevenue / summary.totalGross) * 100).toFixed(0) : 0}% of gross`,
                        icon: <TrendingUp size={14} />,
                        growth: null,
                    },
                    {
                        label: 'Unpaid Balance',
                        value: `$${compactNumber(summary.unpaidBalance)}`,
                        sub: `$${compactNumber(summary.totalPayouts)} paid out`,
                        icon: <Activity size={14} />,
                        growth: null,
                    },
                    {
                        label: 'Revenue / Artist',
                        value: `$${compactNumber(summary.revenuePerArtist)}`,
                        sub: `${summary.totalArtists} artists`,
                        icon: <Users size={14} />,
                        growth: null,
                    },
                ].map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
                        <Card className="p-0">
                            <Card.Content className="p-4 gap-0">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="m-0 text-[9px] font-extrabold tracking-[0.18em] uppercase text-muted">{kpi.label}</p>
                                    <div className="text-muted/50">{kpi.icon}</div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="m-0 text-[26px] font-black text-foreground leading-none tracking-tight">{kpi.value}</p>
                                    {kpi.growth !== null && <GrowthBadge value={kpi.growth} />}
                                </div>
                                <p className="m-0 mt-2 text-[11px] text-muted font-semibold">{kpi.sub}</p>
                            </Card.Content>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

                {/* Revenue vs Payouts */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] pb-3.5 gap-0">
                            <SectionLabel>Revenue vs Payouts</SectionLabel>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.revenueVsPayout.slice(-8)} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={c.fillStop1} />
                                                <stop offset="100%" stopColor={c.fillStop2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                                        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v: number) => `$${compactNumber(v)}`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `$${v.toLocaleString()}`} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="gross" name="Gross" stroke={c.stroke} strokeWidth={1.5} fill="url(#revGrad)" dot={false} />
                                        <Bar dataKey="payouts" name="Payouts" fill={c.bar2} radius={[4, 4, 0, 0]} barSize={16} />
                                        <Line type="monotone" dataKey="netRetained" name="Net Retained" stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>

                {/* Revenue Forecast */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] pb-3.5 gap-0">
                            <div className="flex items-center justify-between mb-1">
                                <SectionLabel>Revenue Forecast</SectionLabel>
                                {data.forecast.length > 0 && (
                                    <span className="text-[9px] font-bold text-muted tracking-wide">
                                        PROJ: ${compactNumber(data.forecast[data.forecast.length - 1]?.projected || 0)}
                                    </span>
                                )}
                            </div>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastChartData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={c.fillStop1} />
                                                <stop offset="100%" stopColor={c.fillStop2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                                        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v: number) => `$${compactNumber(v)}`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip content={<ChartTooltipContent c={c} formatValue={(v, name) => `$${v.toLocaleString()} ${name === 'Projected' ? '(forecast)' : ''}`} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="actual" name="Actual" stroke={c.stroke} strokeWidth={1.5} fill="url(#actualGrad)" dot={false} connectNulls={false} />
                                        <Area type="monotone" dataKey="projected" name="Projected" stroke={c.forecast} strokeWidth={1.5} strokeDasharray="6 4" fill="none" dot={{ r: 3, fill: c.forecast, stroke: c.dotStroke, strokeWidth: 2 }} connectNulls={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>
            </div>

            {/* Row 2: Platform + Growth */}
            <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

                {/* Platform Breakdown */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] gap-0">
                            <SectionLabel>Platform Revenue</SectionLabel>
                            <div className="flex items-start gap-6 flex-wrap">
                                <div style={{ width: 180, height: 180, position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.platforms}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={52}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="gross"
                                                nameKey="source"
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
                                                        <div style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 10, padding: '10px 14px' }}>
                                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: c.tooltipValue }}>{d.source}</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: c.tooltipLabel }}>${d.gross.toLocaleString()} ({d.share.toFixed(1)}%)</p>
                                                            {d.streams > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: c.tooltipLabel }}>{d.streams.toLocaleString()} streams</p>}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <p className="m-0 text-[18px] font-black text-foreground">{data.platforms.length}</p>
                                        <p className="m-0 text-[8px] font-bold text-muted tracking-wide">PLATFORMS</p>
                                    </div>
                                </div>
                                <div className="flex-1 grid gap-2 min-w-[140px]">
                                    {data.platforms.slice(0, 6).map((p, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div style={{ width: 8, height: 8, borderRadius: 2, background: getPlatformColor(p.source), flexShrink: 0 }} />
                                            <span className="text-[11px] font-bold text-foreground flex-1 truncate">{p.source}</span>
                                            <span className="text-[10px] font-bold text-muted">${compactNumber(p.gross)}</span>
                                            <span className="text-[9px] font-bold text-muted/50 w-8 text-right">{p.share.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>

                {/* Monthly Growth Rates */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] gap-0">
                            <SectionLabel>Monthly Growth Rate</SectionLabel>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.revenueTrend.slice(-8).filter((r) => r.growthPct !== null)} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                                        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />} cursor={{ fill: c.grid }} />
                                        <Bar dataKey="growthPct" name="Growth" radius={[4, 4, 0, 0]} barSize={20}>
                                            {data.revenueTrend.slice(-8).filter((r) => r.growthPct !== null).map((entry, i) => (
                                                <Cell key={i} fill={(entry.growthPct ?? 0) >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>
            </div>

            {/* Row 3: Listener Trend + Stream Trend */}
            <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

                {/* Listener Trend */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] pb-3.5 gap-0">
                            <SectionLabel>Listener Trend</SectionLabel>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.listenerTrend.slice(-12)} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={c.fillStop1} />
                                                <stop offset="100%" stopColor={c.fillStop2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                                        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v: number) => compactNumber(v)} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => v.toLocaleString()} />} cursor={{ stroke: c.grid, strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="avg" name="Avg Listeners" stroke={c.stroke} strokeWidth={1.5} fill="url(#listenerGrad)" dot={false} />
                                        <Line type="monotone" dataKey="peak" name="Peak" stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>

                {/* Stream Trend */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
                    <Card className="p-0">
                        <Card.Content className="p-[18px] pb-3.5 gap-0">
                            <SectionLabel>Stream Volume</SectionLabel>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.streamTrend.slice(-12)} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
                                        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v: number) => compactNumber(v)} tick={{ fill: c.tick, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<ChartTooltipContent c={c} formatValue={(v) => `${v.toLocaleString()} streams`} />} cursor={{ fill: c.grid }} />
                                        <Bar dataKey="streams" name="Streams" fill={c.bar1} radius={[4, 4, 0, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Content>
                    </Card>
                </motion.div>
            </div>

            {/* Top Revenue Artists Table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
                <Card className="p-0">
                    <Card.Content className="p-[18px] gap-0">
                        <SectionLabel>Top Artists by Revenue</SectionLabel>
                        <div className="dash-table-scroll">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Artist', 'Gross', 'Label', 'Artist Share', 'Streams', 'Listeners', '$/Listener'].map((h) => (
                                            <th key={h} style={{ padding: '10px 12px', fontSize: 9, letterSpacing: '1.5px', color: c.tick, fontWeight: 800, borderBottom: `1px solid ${c.grid}`, textAlign: h === 'Artist' ? 'left' : 'right', textTransform: 'uppercase' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.perArtistRevenue.slice(0, 15).map((a, i) => (
                                        <tr key={a.artistId} style={{ borderBottom: `1px solid ${c.grid}` }}>
                                            <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="text-[10px] font-black text-muted/40 w-4">{i + 1}</span>
                                                <div className="w-7 h-7 rounded-md overflow-hidden bg-default/10 shrink-0">
                                                    <NextImage src={a.artistImage || FALLBACK_IMAGE} alt={a.artistName} width={28} height={28} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <span className="text-[12px] font-bold text-foreground truncate">{a.artistName}</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: c.tooltipValue }}>${a.gross.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: c.tick }}>${a.labelRevenue.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: c.tick }}>${a.artistShare.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textAlign: 'right', color: c.tick }}>{a.streams > 0 ? compactNumber(a.streams) : '--'}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textAlign: 'right', color: c.tick }}>{a.listeners > 0 ? compactNumber(a.listeners) : '--'}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textAlign: 'right', color: a.revenuePerListener > 0 ? c.tooltipValue : c.tick }}>
                                                {a.revenuePerListener > 0 ? `$${a.revenuePerListener.toFixed(4)}` : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card.Content>
                </Card>
            </motion.div>

            <style jsx>{`
                @media (max-width: 960px) {
                    .analytics-charts-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 820px) {
                    .analytics-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 540px) {
                    .analytics-kpi-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
