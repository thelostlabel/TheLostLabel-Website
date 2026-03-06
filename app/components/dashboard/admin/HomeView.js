import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Briefcase, CreditCard, Users, Mic2, Disc, Music,
    FileAudio, BarChart3, AlertCircle, ChevronRight, TrendingUp, Music2, RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area, ComposedChart, Line
} from 'recharts';
import NextImage from 'next/image';

const T = {
    bg: '#0a0a0a',
    surface: '#111111',
    surfaceAlt: 'linear-gradient(135deg, #111111 0%, #151515 100%)',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.1)',
    text: '#FFFFFF',
    muted: '#666666',
    sub: '#888888',
    accent: '#D1D5DB',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444'
};

const compactNumber = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    return num.toLocaleString();
};

const FALLBACK_IMAGE = '/default-album.jpg';

const normalizeImageSrc = (src) => {
    if (typeof src !== 'string') return FALLBACK_IMAGE;
    const trimmed = src.trim();
    if (!trimmed) return FALLBACK_IMAGE;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return FALLBACK_IMAGE;
};

const handleImageError = (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = FALLBACK_IMAGE;
};

const formatAxisDate = (label, granularity) => {
    if (!label) return '';
    const d = new Date(label);
    if (Number.isNaN(d.getTime())) return label;
    if (granularity === 'monthly') return d.toLocaleDateString('en-US', { month: 'short' });
    if (granularity === 'weekly') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatMonthLabel = (label) => {
    if (!label || typeof label !== 'string') return '';
    const [year, month] = label.split('-');
    if (!year || !month) return label;
    const d = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(d.getTime())) return label;
    return d.toLocaleDateString('en-US', { month: 'short' });
};

const startOfWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
};

const aggregateListenerSeries = (data, granularity) => {
    const normalized = (data || [])
        .map((item) => ({ ...item, _date: new Date(item.label) }))
        .filter((item) => !Number.isNaN(item._date.getTime()))
        .sort((a, b) => a._date - b._date);

    if (granularity === 'daily') {
        return normalized.slice(-30).map((item) => ({ label: item._date.toISOString().slice(0, 10), value: Number(item.value || 0) }));
    }

    if (granularity === 'weekly') {
        const bucket = new Map();
        normalized.forEach((item) => {
            const weekStart = startOfWeek(item._date).toISOString().slice(0, 10);
            const prev = bucket.get(weekStart) || { sum: 0, count: 0 };
            bucket.set(weekStart, { sum: prev.sum + Number(item.value || 0), count: prev.count + 1 });
        });
        return Array.from(bucket.entries())
            .map(([label, v]) => ({ label, value: Math.round(v.sum / Math.max(v.count, 1)) }))
            .slice(-12);
    }

    const monthly = new Map();
    normalized.forEach((item) => {
        const key = `${item._date.getFullYear()}-${String(item._date.getMonth() + 1).padStart(2, '0')}`;
        const prev = monthly.get(key);
        if (!prev || prev._date < item._date) {
            monthly.set(key, { _date: item._date, value: Number(item.value || 0) });
        }
    });
    return Array.from(monthly.entries())
        .map(([key, v]) => ({ label: `${key}-01`, value: v.value }))
        .slice(-12);
};

const aggregateRevenueSeries = (data, granularity) => {
    const monthly = (data || []).slice(-12).map((item) => ({
        label: item.label,
        revenue: Number(item.revenue || 0),
        artistShare: Number(item.artistShare || 0)
    }));

    if (granularity === 'monthly') return monthly;

    const quarterly = new Map();
    monthly.forEach((item) => {
        const [year, monthStr] = String(item.label).split('-');
        const month = Number(monthStr || 1);
        const quarter = Math.floor((month - 1) / 3) + 1;
        const key = `${year}-Q${quarter}`;
        const prev = quarterly.get(key) || { revenue: 0, artistShare: 0 };
        quarterly.set(key, {
            revenue: prev.revenue + item.revenue,
            artistShare: prev.artistShare + item.artistShare
        });
    });
    return Array.from(quarterly.entries()).map(([label, v]) => ({ label, ...v }));
};

/* ── Responsive chart wrapper with ResizeObserver ── */
const ChartContainer = ({ children, height = 220 }) => {
    const ref = useRef(null);
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
        // Delay initial measure to ensure parent is laid out
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

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label, formatLabel, formatValue }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,10,10,0.95)',
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: 12,
            padding: '10px 14px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.5px', marginBottom: 6 }}>
                {formatLabel ? formatLabel(label) : label}
            </p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: 12, fontWeight: 800, color: entry.color || '#fff' }}>
                    {formatValue ? formatValue(entry.value, entry.name) : entry.value}
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#666' }}>{entry.name}</span>
                </p>
            ))}
        </div>
    );
};

/* ── Listener Scale Chart ── */
const ListenerScaleChart = ({ data, height = 220, granularity = 'daily' }) => {
    const tickCount = granularity === 'daily' ? 6 : granularity === 'weekly' ? 6 : undefined;
    return (
        <ChartContainer height={height}>
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <defs>
                    <linearGradient id="listenerFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E5E7EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#E5E7EB" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                    dataKey="label"
                    tickFormatter={(v) => formatAxisDate(v, granularity)}
                    tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickCount={tickCount}
                />
                <YAxis
                    yAxisId="listeners"
                    tickFormatter={compactNumber}
                    tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />
                <YAxis
                    yAxisId="counts"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fill: '#444', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                />
                <Tooltip
                    content={<ChartTooltip
                        formatLabel={(v) => formatAxisDate(v, granularity)}
                        formatValue={(v, name) => {
                            const num = Number(v || 0).toLocaleString();
                            return num;
                        }}
                    />}
                    cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                />
                <Area
                    yAxisId="listeners"
                    type="monotone"
                    dataKey="value"
                    name="Monthly Listeners"
                    stroke="#E5E7EB"
                    strokeWidth={2}
                    fill="url(#listenerFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#E5E7EB', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
                <Line
                    yAxisId="listeners"
                    type="monotone"
                    dataKey="avgPerArtist"
                    name="Per Artist"
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                />
                <Line
                    yAxisId="counts"
                    type="monotone"
                    dataKey="artistCount"
                    name="Artists"
                    stroke="#6B7280"
                    strokeWidth={1.5}
                    dot={false}
                />
                <Line
                    yAxisId="counts"
                    type="monotone"
                    dataKey="releaseCount"
                    name="Releases"
                    stroke="#4B5563"
                    strokeWidth={1.5}
                    dot={false}
                />
            </ComposedChart>
        </ChartContainer>
    );
};

/* ── Revenue Flow Chart ── */
const RevenueFlowChart = ({ data, height = 220, granularity = 'monthly' }) => {
    const chartData = (data || []).slice(-8);
    return (
        <ChartContainer height={height}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E5E7EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#E5E7EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="artFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                    dataKey="label"
                    tickFormatter={(v) => (granularity === 'quarterly' ? String(v).replace('-', ' ') : formatMonthLabel(v))}
                    tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                />
                <YAxis
                    tickFormatter={compactNumber}
                    tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />
                <Tooltip
                    content={<ChartTooltip
                        formatLabel={(v) => (granularity === 'quarterly' ? String(v).replace('-', ' ') : formatMonthLabel(v))}
                        formatValue={(v, name) => `$${Number(v || 0).toLocaleString()}`}
                    />}
                    cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                />
                <Area
                    type="monotone"
                    dataKey="artistShare"
                    name="Artist Share"
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    fill="url(#artFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#9CA3AF', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Label Revenue"
                    stroke="#E5E7EB"
                    strokeWidth={2}
                    fill="url(#revFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#E5E7EB', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
            </AreaChart>
        </ChartContainer>
    );
};

/* ── Pill Toggle ── */
const PillToggle = ({ options, value, onChange }) => (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${T.border}` }}>
        {options.map((opt) => {
            const active = value === opt.key;
            return (
                <button
                    key={opt.key}
                    onClick={() => onChange(opt.key)}
                    style={{
                        border: 'none',
                        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: active ? '#fff' : '#666',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        borderRadius: 8,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

/* ── Chart Legend ── */
const Legend = ({ items }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: 12 }}>
        {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.dashed ? (
                    <span style={{ width: 14, height: 0, borderTop: `2px dashed ${item.color}` }} />
                ) : item.line ? (
                    <span style={{ width: 14, height: 2, borderRadius: 1, background: item.color }} />
                ) : (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                )}
                <span style={{ fontSize: 10, fontWeight: 700, color: item.color }}>{item.label}</span>
            </div>
        ))}
    </div>
);

/* ── Card wrapper ── */
const Card = ({ children, style, ...props }) => (
    <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        ...style
    }} {...props}>
        {children}
    </div>
);

/* ── Main component ── */
export default function HomeView({ onNavigate }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [listenerGranularity, setListenerGranularity] = useState('daily');
    const [revenueGranularity, setRevenueGranularity] = useState('monthly');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const listenerSeriesData = useMemo(
        () => aggregateListenerSeries(stats?.listenerTrends || [], listenerGranularity),
        [stats?.listenerTrends, listenerGranularity]
    );
    const revenueSeriesData = useMemo(
        () => aggregateRevenueSeries(stats?.trends || [], revenueGranularity),
        [stats?.trends, revenueGranularity]
    );

    const latestListeners = listenerSeriesData.at(-1)?.value || 0;
    const prevListeners = listenerSeriesData.at(-2)?.value || 0;
    const listenerDeltaPct = prevListeners > 0 ? ((latestListeners - prevListeners) / prevListeners) * 100 : 0;
    const compareSeriesData = listenerSeriesData.map((point) => ({
        ...point,
        artistCount: Number(stats?.counts?.artists || 0),
        releaseCount: Number(stats?.counts?.releases || 0),
        avgPerArtist: Number(stats?.counts?.artists || 0) > 0 ? Math.round((Number(point.value || 0) / Number(stats?.counts?.artists || 0))) : 0
    }));

    const kpiCards = [
        {
            label: 'Monthly Listeners',
            value: stats?.counts?.listenersTotal || 0,
            sub: 'All artists combined',
            icon: <BarChart3 size={16} />,
            wide: true
        },
        {
            label: 'Total Releases',
            value: Number(stats?.counts?.releases || 0),
            sub: 'Catalog count',
            icon: <Disc size={14} />
        },
        {
            label: 'Total Tracks',
            value: Number(stats?.counts?.songs || 0),
            sub: 'Across all releases',
            icon: <Music2 size={14} />
        },
        {
            label: 'Total Artists',
            value: Number(stats?.counts?.artists || 0),
            sub: 'Signed profiles',
            icon: <Users size={14} />
        }
    ];

    if (loading) {
        return (
            <div style={{ padding: '0 0 40px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 26, marginBottom: 12 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, letterSpacing: '2px', fontWeight: 800, color: T.muted }}>ADMIN DASHBOARD</p>
                            <p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 900, color: '#fff' }}>Loading analytics...</p>
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.accent }}
                        />
                    </div>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                    {[1, 2, 3, 4].map((item) => (
                        <motion.div
                            key={item}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: item * 0.08 }}
                            style={{ height: 100, borderRadius: 16, background: '#131313', border: `1px solid ${T.border}` }}
                        />
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[1, 2].map((item) => (
                        <motion.div
                            key={item}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.4, delay: item * 0.1 }}
                            style={{ height: 380, borderRadius: 16, background: '#131313', border: `1px solid ${T.border}` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div style={{ padding: '0 0 40px 0', fontFamily: 'Space Grotesk, sans-serif' }}>

            {/* ── KPI Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                {kpiCards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Card style={{ height: '100%' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)` }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{card.label}</p>
                                <span style={{
                                    width: 28, height: 28, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${T.border}`,
                                    display: 'grid', placeItems: 'center',
                                    color: T.sub
                                }}>
                                    {card.icon}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: card.wide ? 28 : 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                {compactNumber(card.value)}
                            </p>
                            <p style={{ margin: '8px 0 0', fontSize: 10, fontWeight: 600, color: T.muted }}>{card.sub}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                {/* Revenue Flow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Card style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '1.5px' }}>REVENUE FLOW</p>
                                <h2 style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                                    ${(stats.counts.gross || 0).toLocaleString()}
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: T.sub, fontWeight: 600 }}>Gross earnings</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: '1px' }}>PAYOUTS</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 15, color: '#fff', fontWeight: 800 }}>${(stats.counts.payouts || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: '1px' }}>LABEL</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 15, color: T.accent, fontWeight: 800 }}>${(stats.counts.revenue || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <PillToggle
                                    options={[{ key: 'monthly', label: 'Monthly' }, { key: 'quarterly', label: 'Quarterly' }]}
                                    value={revenueGranularity}
                                    onChange={setRevenueGranularity}
                                />
                            </div>
                        </div>

                        <RevenueFlowChart data={revenueSeriesData} height={220} granularity={revenueGranularity} />

                        <Legend items={[
                            { color: '#E5E7EB', label: 'Label Revenue' },
                            { color: '#9CA3AF', label: 'Artist Share' }
                        ]} />
                    </Card>
                </motion.div>

                {/* Listener Scale */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Card style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '1.5px' }}>LISTENER SCALE</p>
                                <h2 style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                                    {latestListeners.toLocaleString()}
                                </h2>
                                <p style={{
                                    margin: '4px 0 0', fontSize: 11, fontWeight: 700,
                                    color: listenerDeltaPct >= 0 ? T.accent : T.sub
                                }}>
                                    {listenerDeltaPct >= 0 ? '+' : ''}{listenerDeltaPct.toFixed(1)}% vs previous
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                                    <div style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                        <p style={{ margin: 0, fontSize: 9, color: T.muted, fontWeight: 700 }}>Artists</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>{Number(stats.counts.artists || 0).toLocaleString()}</p>
                                    </div>
                                    <div style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                        <p style={{ margin: 0, fontSize: 9, color: T.muted, fontWeight: 700 }}>Releases</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>{Number(stats.counts.releases || 0).toLocaleString()}</p>
                                    </div>
                                    <div style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                        <p style={{ margin: 0, fontSize: 9, color: T.muted, fontWeight: 700 }}>Per Artist</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                            {(Number(stats.counts.artists || 0) ? Math.round(latestListeners / Number(stats.counts.artists || 0)) : 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <PillToggle
                                    options={[
                                        { key: 'daily', label: 'Daily' },
                                        { key: 'weekly', label: 'Weekly' },
                                        { key: 'monthly', label: 'Monthly' }
                                    ]}
                                    value={listenerGranularity}
                                    onChange={setListenerGranularity}
                                />
                            </div>
                        </div>

                        <ListenerScaleChart data={compareSeriesData} height={220} granularity={listenerGranularity} />

                        <Legend items={[
                            { color: '#E5E7EB', label: 'Monthly Listeners' },
                            { color: '#9CA3AF', label: 'Per Artist', dashed: true },
                            { color: '#6B7280', label: 'Artist Count', line: true },
                            { color: '#4B5563', label: 'Release Count', line: true }
                        ]} />
                    </Card>
                </motion.div>
            </div>

            {/* ── Bottom Row: Sidebar Stats + Top Artists + Actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>

                {/* Left: Stats Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.3 }}
                    >
                        <Card>
                            <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '1.5px' }}>TOP PLATFORM</p>
                            <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                                {(stats.platforms?.[0]?.label || 'N/A')}
                            </p>
                            <p style={{ margin: '6px 0 0', fontSize: 11, color: T.accent, fontWeight: 700 }}>
                                ${Number(stats.platforms?.[0]?.value || 0).toLocaleString()} label revenue
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.35 }}
                    >
                        <Card>
                            <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '1.5px' }}>AVG PER ARTIST</p>
                            <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                                {stats.counts.artists ? Math.round((stats.counts.listenersTotal || 0) / stats.counts.artists).toLocaleString() : '0'}
                            </p>
                            <p style={{ margin: '6px 0 0', fontSize: 11, color: T.accent, fontWeight: 700 }}>
                                monthly listeners
                            </p>
                        </Card>
                    </motion.div>

                    {/* Action Cards */}
                    {[
                        { title: 'Create Release', desc: 'Add to catalog', icon: <RefreshCw size={18} />, target: 'submissions' },
                        { title: 'Invite Team', desc: 'Add new users', icon: <Users size={18} />, target: 'users' },
                    ].map((a, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.4 + i * 0.05 }}
                        >
                            <Card
                                onClick={() => onNavigate(a.target)}
                                style={{ cursor: 'pointer', transition: 'border-color 0.2s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = T.borderHover}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${T.border}`,
                                        display: 'grid', placeItems: 'center',
                                        color: T.sub
                                    }}>
                                        {a.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{a.title}</h4>
                                        <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{a.desc}</p>
                                    </div>
                                    <ChevronRight size={16} color={T.sub} />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Right: Top Artists */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <Card style={{ padding: 24, height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '1.5px' }}>TOP ARTISTS</p>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: T.sub, fontWeight: 600 }}>By monthly listeners</p>
                            </div>
                            <button
                                onClick={() => onNavigate('artists')}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${T.border}`,
                                    color: '#fff',
                                    fontSize: 10,
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                VIEW ALL
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                            {(stats.topArtists || []).slice(0, 5).map((a, i) => (
                                <motion.div
                                    key={a.id || i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35, delay: 0.4 + i * 0.06 }}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onNavigate('artists')}
                                >
                                    <div style={{
                                        width: '100%', aspectRatio: '1/1', borderRadius: 12,
                                        overflow: 'hidden', background: '#000', marginBottom: 10,
                                        border: `1px solid ${T.border}`
                                    }}>
                                        <NextImage
                                            src={normalizeImageSrc(a.image)}
                                            alt={a.name || 'Artist'}
                                            width={320}
                                            height={320}
                                            unoptimized
                                            onError={handleImageError}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                                    <p style={{ fontSize: 10, color: T.muted, margin: '3px 0 0', fontWeight: 600 }}>{(a.monthlyListeners || 0).toLocaleString()} listeners</p>
                                </motion.div>
                            ))}
                            {(!stats.topArtists || stats.topArtists.length === 0) && (
                                <p style={{ gridColumn: '1 / -1', fontSize: 11, color: T.muted, margin: 0 }}>No artist data available yet.</p>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>

            <style jsx>{`
                @media (max-width: 1100px) {
                    div { font-family: 'Space Grotesk', sans-serif; }
                }
            `}</style>
        </div>
    );
}
