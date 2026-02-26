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

const DASHBOARD_THEME = {
    bg: '#050505',
    surface: '#0E0E0E',
    surfaceElevated: '#161616',
    surfaceSoft: '#1A1A1A',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    muted: '#888888',
    accent: '#FFFFFF',
    accentCyan: '#A0A0A0',
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

const formatTrendLabel = (label) => {
    if (!label) return '';
    const d = new Date(label);
    if (Number.isNaN(d.getTime())) return label;
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

const formatListenerAxisLabel = (label, granularity) => {
    if (!label) return '';
    const d = new Date(label);
    if (Number.isNaN(d.getTime())) return label;
    if (granularity === 'monthly') return d.toLocaleDateString('en-US', { month: 'short' });
    if (granularity === 'weekly') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const startOfWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // monday-based
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

const CircularProgress = ({ value, label, subtitle, size = 60 }) => {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', margin: 0 }}>{label}</h4>
                    <p style={{ fontSize: '11px', color: DASHBOARD_THEME.accent, marginTop: '4px' }}>{subtitle}</p>
                </div>
                <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={DASHBOARD_THEME.accent}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
            <div>
                <p style={{ fontSize: '10px', fontWeight: '600', color: DASHBOARD_THEME.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>CURRENT</p>
                <p style={{ fontSize: '18px', fontWeight: '800', color: DASHBOARD_THEME.accent, margin: '2px 0 0 0' }}>{compactNumber(value)} <span style={{ fontSize: '12px', fontWeight: '500', color: `${DASHBOARD_THEME.accent}b2` }}>8% <TrendingUp size={12} /></span></p>
            </div>
            <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', fontWeight: '600', color: DASHBOARD_THEME.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>% OF GLOBAL</p>
                <p style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: '2px 0 0 0' }}>{Math.round(value / 20)}%</p>
            </div>
        </div>

    );
};

const GlowChart = ({ data, color, height = 140 }) => {
    const containerRef = useRef(null);
    const [canRenderChart, setCanRenderChart] = useState(false);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const updateReady = () => {
            const rect = node.getBoundingClientRect();
            setCanRenderChart(rect.width > 0 && rect.height > 0);
        };

        updateReady();

        if (typeof ResizeObserver === 'undefined') {
            const raf = requestAnimationFrame(updateReady);
            return () => cancelAnimationFrame(raf);
        }

        const observer = new ResizeObserver(() => updateReady());
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: `${height}px`, minWidth: 0, minHeight: `${height}px` }}>
            {canRenderChart && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 2 }}>
                        <defs>
                            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickFormatter={formatTrendLabel}
                            tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={20}
                        />
                        <YAxis
                            tickFormatter={compactNumber}
                            tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                        />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                            contentStyle={{
                                background: '#111',
                                border: `1px solid ${DASHBOARD_THEME.border}`,
                                borderRadius: 10,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700
                            }}
                            labelFormatter={(value) => formatTrendLabel(value)}
                            formatter={(value) => [Number(value || 0).toLocaleString(), 'Listeners']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={3}
                            fill="url(#glowGradient)"
                            isAnimationActive={true}
                            dot={false}
                            activeDot={{ r: 4, fill: color, stroke: '#0a0a0a', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const ListenerScaleChart = ({ data, height = 220, granularity = 'daily' }) => {
    const containerRef = useRef(null);
    const [canRenderChart, setCanRenderChart] = useState(false);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const updateReady = () => {
            const rect = node.getBoundingClientRect();
            setCanRenderChart(rect.width > 0 && rect.height > 0);
        };

        updateReady();

        if (typeof ResizeObserver === 'undefined') {
            const raf = requestAnimationFrame(updateReady);
            return () => cancelAnimationFrame(raf);
        }

        const observer = new ResizeObserver(() => updateReady());
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: `${height}px`, minWidth: 0, minHeight: `${height}px` }}>
            {canRenderChart && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <ComposedChart data={data} margin={{ top: 8, right: 12, left: 6, bottom: 2 }}>
                        <defs>
                            <linearGradient id="listenerCompareGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.22} />
                                <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickFormatter={(value) => formatListenerAxisLabel(value, granularity)}
                            tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={20}
                        />
                        <YAxis
                            yAxisId="listeners"
                            tickFormatter={compactNumber}
                            tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            width={38}
                        />
                        <YAxis
                            yAxisId="counts"
                            orientation="right"
                            allowDecimals={false}
                            tick={{ fill: '#555', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                        />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                            contentStyle={{
                                background: '#111',
                                border: `1px solid ${DASHBOARD_THEME.border}`,
                                borderRadius: 10,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700
                            }}
                            labelFormatter={(value) => formatListenerAxisLabel(value, granularity)}
                            formatter={(value, name) => {
                                const raw = Number(value || 0);
                                if (name === 'value') return [raw.toLocaleString(), 'Monthly Listeners'];
                                if (name === 'avgPerArtist') return [raw.toLocaleString(), 'Listeners / Artist'];
                                if (name === 'artistCount') return [raw.toLocaleString(), 'Artist Count'];
                                if (name === 'releaseCount') return [raw.toLocaleString(), 'Release Count'];
                                return [raw.toLocaleString(), name];
                            }}
                        />
                        <Area
                            yAxisId="listeners"
                            type="monotone"
                            dataKey="value"
                            stroke="#E5E7EB"
                            strokeWidth={2.6}
                            fill="url(#listenerCompareGradient)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#E5E7EB', stroke: '#0a0a0a', strokeWidth: 2 }}
                        />
                        <Line
                            yAxisId="listeners"
                            type="monotone"
                            dataKey="avgPerArtist"
                            stroke="#9CA3AF"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                        />
                        <Line
                            yAxisId="counts"
                            type="monotone"
                            dataKey="artistCount"
                            stroke="#6B7280"
                            strokeWidth={1.8}
                            dot={false}
                        />
                        <Line
                            yAxisId="counts"
                            type="monotone"
                            dataKey="releaseCount"
                            stroke="#4B5563"
                            strokeWidth={1.8}
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const RevenueFlowChart = ({ data, height = 250, granularity = 'monthly' }) => {
    const chartData = (data || []).slice(-8);

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="labelRevenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.24} />
                            <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="artistShareFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tickFormatter={(value) => (granularity === 'quarterly' ? String(value).replace('-', ' ') : formatMonthLabel(value))}
                        tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={compactNumber}
                        tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                    />
                    <Tooltip
                        cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                        contentStyle={{
                            background: '#111',
                            border: `1px solid ${DASHBOARD_THEME.border}`,
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700
                        }}
                        labelFormatter={(value) => (granularity === 'quarterly' ? String(value).replace('-', ' ') : formatMonthLabel(value))}
                        formatter={(value, name) => [`$${Number(value || 0).toLocaleString()}`, name === 'revenue' ? 'Label Revenue' : 'Artist Share']}
                    />
                    <Area
                        type="monotone"
                        dataKey="artistShare"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        fill="url(#artistShareFill)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#9CA3AF', stroke: '#0a0a0a', strokeWidth: 2 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#E5E7EB"
                        strokeWidth={2.6}
                        fill="url(#labelRevenueFill)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#E5E7EB', stroke: '#0a0a0a', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

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
    const miniStats = [
        {
            label: 'Total Releases',
            value: Number(stats?.counts?.releases || 0),
            helper: 'Catalog count',
            icon: <Disc size={14} />
        },
        {
            label: 'Total Tracks',
            value: Number(stats?.counts?.songs || 0),
            helper: 'Across all releases',
            icon: <Music2 size={14} />
        },
        {
            label: 'Total Artists',
            value: Number(stats?.counts?.artists || 0),
            helper: 'Signed profiles',
            icon: <Users size={14} />
        }
    ];
    const miniMax = Math.max(1, ...miniStats.map((item) => item.value));

    if (loading) {
        return (
            <div style={{ padding: '0 0 40px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    style={{
                        background: DASHBOARD_THEME.surface,
                        border: `1px solid ${DASHBOARD_THEME.border}`,
                        borderRadius: '20px',
                        padding: '26px',
                        marginBottom: '12px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: DASHBOARD_THEME.muted }}>ADMIN DASHBOARD</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 900, color: '#fff' }}>Loading analytics...</p>
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: `2px solid ${DASHBOARD_THEME.border}`,
                                borderTopColor: DASHBOARD_THEME.accent
                            }}
                        />
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    {[1, 2, 3].map((item) => (
                        <motion.div
                            key={item}
                            initial={{ opacity: 0.35 }}
                            animate={{ opacity: [0.35, 0.7, 0.35] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: item * 0.08 }}
                            style={{ height: 76, borderRadius: 12, background: '#0E0E0E', border: `1px solid ${DASHBOARD_THEME.border}` }}
                        />
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <motion.div
                            initial={{ opacity: 0.35 }}
                            animate={{ opacity: [0.35, 0.7, 0.35] }}
                            transition={{ repeat: Infinity, duration: 1.3 }}
                            style={{ height: 220, borderRadius: 20, background: '#0E0E0E', border: `1px solid ${DASHBOARD_THEME.border}` }}
                        />
                        <motion.div
                            initial={{ opacity: 0.35 }}
                            animate={{ opacity: [0.35, 0.7, 0.35] }}
                            transition={{ repeat: Infinity, duration: 1.3, delay: 0.1 }}
                            style={{ height: 300, borderRadius: 20, background: '#0E0E0E', border: `1px solid ${DASHBOARD_THEME.border}` }}
                        />
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {[1, 2, 3, 4].map((item) => (
                            <motion.div
                                key={item}
                                initial={{ opacity: 0.35 }}
                                animate={{ opacity: [0.35, 0.7, 0.35] }}
                                transition={{ repeat: Infinity, duration: 1.1, delay: item * 0.06 }}
                                style={{ height: item === 4 ? 220 : 120, borderRadius: 20, background: '#0E0E0E', border: `1px solid ${DASHBOARD_THEME.border}` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    if (!stats) return null;

    return (
        <div style={{ padding: '0 0 40px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
            {/* Header Mini Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ padding: '16px 20px', background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: DASHBOARD_THEME.muted, marginBottom: '4px' }}>Monthly Listeners</p>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: 0 }}>{(stats.counts.listenersTotal || 0).toLocaleString()}</p>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: DASHBOARD_THEME.accent, marginTop: '6px', marginBottom: 0 }}>All artists combined</p>
                </div>
                {miniStats.map((s, i) => (
                    <div key={i} style={{ padding: '14px 16px', background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '11px', fontWeight: '800', color: DASHBOARD_THEME.muted, margin: 0 }}>{s.label}</p>
                            <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DASHBOARD_THEME.border}`, display: 'grid', placeItems: 'center', color: DASHBOARD_THEME.accent }}>
                                {s.icon}
                            </span>
                        </div>
                        <p style={{ fontSize: '21px', fontWeight: '900', color: '#fff', margin: 0 }}>{compactNumber(s.value)}</p>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#7d7d7d', margin: 0 }}>{s.helper}</p>
                        <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: '2px' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(8, (s.value / miniMax) * 100)}%` }}
                                transition={{ duration: 0.55, delay: 0.05 * i, ease: 'easeOut' }}
                                style={{ height: '100%', borderRadius: 999, background: i === 0 ? '#E5E7EB' : i === 1 ? '#9CA3AF' : '#6B7280' }}
                            />
                        </div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: DASHBOARD_THEME.accent }}>
                            {Math.round((s.value / miniMax) * 100)}% of top metric
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'start' }}>
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Top Analytics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{
                            background: '#0E0E0E',
                            borderRadius: '20px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '320px',
                            border: `1px solid ${DASHBOARD_THEME.border}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '10px', color: DASHBOARD_THEME.muted, fontWeight: 800, letterSpacing: '1.5px' }}>REVENUE FLOW</p>
                                    <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: 900, color: '#fff' }}>
                                        ${(stats.counts.gross || 0).toLocaleString()}
                                    </h2>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#999', fontWeight: 700 }}>Gross earnings trend</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '10px', color: DASHBOARD_THEME.muted, fontWeight: 800, letterSpacing: '1.5px' }}>PAYOUTS</p>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '16px', color: '#fff', fontWeight: 900 }}>${(stats.counts.payouts || 0).toLocaleString()}</p>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: DASHBOARD_THEME.accent, fontWeight: 800 }}>
                                        Label: ${(stats.counts.revenue || 0).toLocaleString()}
                                    </p>
                                    <div style={{ display: 'inline-flex', gap: '6px', marginTop: '8px' }}>
                                        {[
                                            { key: 'monthly', label: 'Monthly' },
                                            { key: 'quarterly', label: 'Quarterly' }
                                        ].map((opt) => {
                                            const active = revenueGranularity === opt.key;
                                            return (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => setRevenueGranularity(opt.key)}
                                                    style={{
                                                        border: `1px solid ${active ? '#4b5563' : DASHBOARD_THEME.border}`,
                                                        background: active ? 'rgba(156,163,175,0.16)' : 'rgba(255,255,255,0.03)',
                                                        color: active ? '#fff' : '#888',
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        letterSpacing: '0.5px',
                                                        borderRadius: 8,
                                                        padding: '5px 9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <RevenueFlowChart data={revenueSeriesData} granularity={revenueGranularity} />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E5E7EB' }} />
                                    <span style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 700 }}>Label Revenue</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9CA3AF' }} />
                                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700 }}>Artist Share</span>
                                </div>
                            </div>

                            <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: '70%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)', transform: 'rotate(-20deg)' }} />
                        </div>

                        <div style={{ background: '#0E0E0E', border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '20px', padding: '20px', minHeight: '320px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
                                <div>
                                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', margin: 0 }}>Monthly Listener Scale</h4>
                                    <p style={{ fontSize: '11px', color: DASHBOARD_THEME.muted, marginTop: '4px' }}>Compared with artist and release counts</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0 }}>{latestListeners.toLocaleString()}</p>
                                    <p style={{ fontSize: '10px', fontWeight: '800', marginTop: '2px', color: listenerDeltaPct >= 0 ? '#d1d5db' : '#9ca3af' }}>
                                        {listenerDeltaPct >= 0 ? '+' : ''}{listenerDeltaPct.toFixed(1)}% vs previous
                                    </p>
                                    <div style={{ display: 'inline-flex', gap: '6px', marginTop: '8px' }}>
                                        {[
                                            { key: 'daily', label: 'Daily' },
                                            { key: 'weekly', label: 'Weekly' },
                                            { key: 'monthly', label: 'Monthly' }
                                        ].map((opt) => {
                                            const active = listenerGranularity === opt.key;
                                            return (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => setListenerGranularity(opt.key)}
                                                    style={{
                                                        border: `1px solid ${active ? '#4b5563' : DASHBOARD_THEME.border}`,
                                                        background: active ? 'rgba(209,213,219,0.14)' : 'rgba(255,255,255,0.03)',
                                                        color: active ? '#fff' : '#888',
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        letterSpacing: '0.5px',
                                                        borderRadius: 8,
                                                        padding: '5px 9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
                                    <div style={{ padding: '8px 10px', border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: 10, background: '#0E0E0E' }}>
                                    <p style={{ margin: 0, fontSize: 10, color: '#666', fontWeight: 800 }}>Artists</p>
                                    <p style={{ margin: '3px 0 0 0', fontSize: 14, fontWeight: 900, color: '#fff' }}>{Number(stats.counts.artists || 0).toLocaleString()}</p>
                                </div>
                                    <div style={{ padding: '8px 10px', border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: 10, background: '#0E0E0E' }}>
                                    <p style={{ margin: 0, fontSize: 10, color: '#666', fontWeight: 800 }}>Releases</p>
                                    <p style={{ margin: '3px 0 0 0', fontSize: 14, fontWeight: 900, color: '#fff' }}>{Number(stats.counts.releases || 0).toLocaleString()}</p>
                                </div>
                                    <div style={{ padding: '8px 10px', border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: 10, background: '#0E0E0E' }}>
                                    <p style={{ margin: 0, fontSize: 10, color: '#666', fontWeight: 800 }}>Listeners / Artist</p>
                                    <p style={{ margin: '3px 0 0 0', fontSize: 14, fontWeight: 900, color: '#fff' }}>
                                        {(Number(stats.counts.artists || 0) ? Math.round(latestListeners / Number(stats.counts.artists || 0)) : 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{ height: '220px', width: '100%', position: 'relative', margin: '12px 0 10px', zIndex: 2 }}>
                                <ListenerScaleChart data={compareSeriesData} height={220} granularity={listenerGranularity} />
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E5E7EB' }} />
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#d1d5db' }}>Monthly Listeners</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{ width: 14, height: 2, borderRadius: 1, background: '#9CA3AF' }} />
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af' }}>Listeners / Artist</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{ width: 14, height: 2, borderRadius: 1, background: '#6B7280' }} />
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#8b8b8b' }}>Artist Count</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{ width: 14, height: 2, borderRadius: 1, background: '#4B5563' }} />
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#767676' }}>Release Count</span>
                                </div>
                            </div>

                            <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: '70%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)', transform: 'rotate(-20deg)' }} />
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            { title: 'Create Release', desc: 'Add a release to your catalog', icon: <RefreshCw size={20} />, target: 'submissions' },
                            { title: 'Invite Team', desc: 'Invite users to use your account', icon: <Users size={20} />, target: 'users' },
                        ].map((a, i) => (
                            <div key={i} onClick={() => onNavigate(a.target)} style={{ padding: '24px', background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center', color: DASHBOARD_THEME.muted }}>
                                    {a.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>{a.title}</h4>
                                    <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '2px' }}>{a.desc}</p>
                                </div>
                                <ChevronRight size={18} color={DASHBOARD_THEME.accent} />
                            </div>
                        ))}
                    </div>

                    {/* Recent Releases */}
                    <div style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '20px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Top Artists</h3>
                            <button onClick={() => onNavigate('artists')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '10px', padding: '6px 12px', borderRadius: '4px', fontWeight: '900', cursor: 'pointer' }}>SHOW ALL</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                            {(stats.topArtists || []).slice(0, 4).map((a, i) => (
                                <div key={a.id || i} style={{ cursor: 'pointer' }} onClick={() => onNavigate('artists')}>
                                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '8px', border: `1px solid ${DASHBOARD_THEME.border}` }}>
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
                                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                                    <p style={{ fontSize: '10px', color: DASHBOARD_THEME.muted, marginTop: '2px' }}>{(a.monthlyListeners || 0).toLocaleString()} listeners</p>
                                </div>
                            ))}
                            {(!stats.topArtists || stats.topArtists.length === 0) && (
                                <p style={{ gridColumn: '1 / -1', fontSize: '11px', color: DASHBOARD_THEME.muted, margin: 0 }}>No artist data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '20px', padding: '18px' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: DASHBOARD_THEME.muted, fontWeight: 800, letterSpacing: '1.5px' }}>TOP PLATFORM</p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                            {(stats.platforms?.[0]?.label || 'N/A')}
                        </p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: DASHBOARD_THEME.accent, fontWeight: 800 }}>
                            ${Number(stats.platforms?.[0]?.value || 0).toLocaleString()} label revenue
                        </p>
                    </div>

                    <div style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '20px', padding: '18px' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: DASHBOARD_THEME.muted, fontWeight: 800, letterSpacing: '1.5px' }}>AVERAGE PER ARTIST</p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                            {stats.counts.artists ? Math.round((stats.counts.listenersTotal || 0) / stats.counts.artists).toLocaleString() : '0'}
                        </p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: DASHBOARD_THEME.accent, fontWeight: 800 }}>
                            monthly listeners
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
