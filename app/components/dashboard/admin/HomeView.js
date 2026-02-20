import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Briefcase, CreditCard, Users, Mic2, Disc, Music,
    FileAudio, BarChart3, AlertCircle
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area, PieChart, Pie, Cell
} from 'recharts';
import { glassStyle } from './styles';

const ChartTooltip = ({ active, payload, label, color }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#000',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '9px', color: '#555', fontWeight: '900', letterSpacing: '2px', marginBottom: '6px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: '900', color: p.color || color || '#fff' }}>
                    ${Number(p.value).toLocaleString()}
                </div>
            ))}
        </div>
    );
};

function formatChartValue(v) {
    const value = Number(v) || 0;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    return `${Math.round(value)}`;
}

const RechartsAreaChart = ({ data, color = '#8b5cf6', height = 260 }) => {
    const sanitizedData = Array.isArray(data)
        ? data.filter((point) => point && Number.isFinite(Number(point.value)))
        : [];

    if (sanitizedData.length === 0) return (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '800' }}>
            NO DATA AVAILABLE
        </div>
    );

    if (sanitizedData.length === 1) {
        const onlyPoint = sanitizedData[0];
        return (
            <div style={{
                width: '100%',
                height: `${height}px`,
                marginTop: '10px',
                borderRadius: '2px',
                border: '1px dashed rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.01)',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div>
                    <div style={{ fontSize: '10px', letterSpacing: '1.6px', color: '#99a5b6', fontWeight: '800', marginBottom: '8px' }}>
                        SINGLE DATA POINT
                    </div>
                    <div style={{ fontSize: '34px', fontWeight: '900', color }}>
                        ${Number(onlyPoint.value).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#b2bac6', fontWeight: '800', marginTop: '8px' }}>
                        {onlyPoint.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#7f8b9b', marginTop: '8px' }}>
                        Trend chart appears automatically as more months are collected.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: `${height}px`, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={sanitizedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="8%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.11)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#aeb6c2', fontWeight: 800 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.16)' }}
                        tickFormatter={(v) => v?.includes?.('-') ? v.split('-')[1] : v}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#aeb6c2', fontWeight: 800 }}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tickCount={5}
                        tickFormatter={formatChartValue}
                    />
                    <Tooltip content={<ChartTooltip color={color} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.8}
                        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                        dot={{ r: 4, fill: '#000', stroke: color, strokeWidth: 2.2 }}
                        activeDot={{ r: 6, fill: color, stroke: '#000', strokeWidth: 2.2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const DonutChart = ({ data }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const topItem = data.reduce((best, item) => (item.value > best.value ? item : best), data[0] || { label: 'TOTAL', value: 0, color: '#666' });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="label"
                            strokeWidth={0}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}55)` }} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div style={{
                                        background: '#000',
                                        border: '1px solid var(--border)',
                                        borderRadius: '2px',
                                        padding: '10px 14px',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#555', letterSpacing: '1px' }}>{payload[0].name}</div>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>
                                            ${Number(payload[0].value).toLocaleString()} ({total ? Math.round((payload[0].value / total) * 100) : 0}%)
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                        {total ? `${Math.round((topItem.value / total) * 100)}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '1px' }}>{topItem.label}</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '150px' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '10px 1fr 36px', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}66` }} />
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#777', textAlign: 'right' }}>
                            {total ? Math.round((item.value / total) * 100) : 0}%
                        </div>
                        <div style={{ gridColumn: '2 / 4', height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                            <div style={{ width: `${total ? Math.round((item.value / total) * 100) : 0}%`, height: '100%', background: item.color, boxShadow: `0 0 10px ${item.color}55`, transition: 'width 1s ease' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GoalProgress = ({ label, current, target, color }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    return (
        <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '950', color: '#fff' }}>{percentage}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--glass)', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: color, boxShadow: `0 0 10px ${color}33` }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '8px', color: '#333', fontWeight: '800' }}>CUR: {current.toLocaleString()}</span>
                <span style={{ fontSize: '8px', color: '#333', fontWeight: '800' }}>TGT: {target.toLocaleString()}</span>
            </div>
        </div>
    );
};

function pickPlatformColor(label) {
    const upper = (label || '').toUpperCase();
    if (upper.includes('SPOT')) return '#1DB954';
    if (upper.includes('APPLE')) return '#FA243C';
    if (upper.includes('YT') || upper.includes('YOU')) return '#FF0000';
    if (upper.includes('AMAZON')) return '#FF9900';
    if (upper.includes('TIDAL')) return '#00A0FF';
    if (upper.includes('DEEZER')) return '#A238FF';
    if (upper.includes('TIKTOK')) return '#FE2C55';
    return '#777';
}

// Local style removed to use shared style from ./styles.js

export default function HomeView() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('12m'); // 3m, 6m, 12m
    const [miniEarnings, setMiniEarnings] = useState([]);
    const [miniPayments, setMiniPayments] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchMiniData();
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

    const fetchMiniData = async () => {
        try {
            const [earnRes, payRes] = await Promise.all([
                fetch('/api/earnings'),
                fetch('/api/payments')
            ]);
            if (earnRes.ok) {
                const data = await earnRes.json();
                const sorted = (data.earnings || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setMiniEarnings(sorted.slice(0, 5));
            }
            if (payRes.ok) {
                const data = await payRes.json();
                const sorted = (data.payments || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setMiniPayments(sorted.slice(0, 5));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <motion.p
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}
                >
                    REFRESHING_ANALYTICS
                </motion.p>
            </div>
        );
    }
    if (!stats) return null;

    const cards = [
        { label: 'GROSS_VOLUME', value: `$${(stats.counts.gross || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'var(--accent)', icon: <DollarSign size={20} />, trend: '+12.5%' },
        { label: 'NET_REVENUE', value: `$${(stats.counts.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'var(--accent)', icon: <Briefcase size={20} />, trend: '+8.2%' },
        { label: 'TOTAL_PAYOUTS', value: `$${(stats.counts.payouts || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#00ff88', icon: <CreditCard size={20} /> },
        { label: 'TOTAL_USERS', value: stats.counts.users || 0, color: '#fff', icon: <Users size={20} /> },
        { label: 'TOTAL_ARTISTS', value: stats.counts.artists, color: '#fff', icon: <Mic2 size={20} /> },
        { label: 'TOTAL_RELEASES', value: stats.counts.albums || 0, color: '#fff', icon: <Disc size={20} /> },
        { label: 'TOTAL_SONGS', value: stats.counts.songs || 0, color: '#fff', icon: <Music size={20} /> },
        { label: 'TOTAL_DEMOS', value: stats.counts.totalDemos || 0, color: '#fff', icon: <FileAudio size={20} /> },
        { label: 'PENDING_DEMOS', value: stats.counts.pendingDemos, color: stats.counts.pendingDemos > 0 ? 'var(--accent)' : '#fff', icon: <BarChart3 size={20} /> },
        { label: 'OPEN_REQUESTS', value: stats.counts.pendingRequests, color: stats.counts.pendingRequests > 0 ? 'var(--status-warning)' : '#fff', icon: <AlertCircle size={20} /> }
    ];

    const chartData = (() => {
        if (!stats?.trends) return [];
        const arr = [...stats.trends];
        if (range === '3m') return arr.slice(-3);
        if (range === '6m') return arr.slice(-6);
        return arr.slice(-12);
    })();

    const platformData = (stats?.platforms?.length ? stats.platforms : []).map(p => ({
        label: p.label,
        value: p.value,
        color: pickPlatformColor(p.label)
    }));

    const revenueChartColor = '#8b5cf6';
    const payoutChartColor = '#00ff88';

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ width: '8px', height: '8px', borderRadius: '0px', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}
                    />
                    <span style={{ fontSize: '10px', color: '#555', fontWeight: '900', letterSpacing: '4px' }}>SYSTEM_LIVE // ANALYTICS_REALTIME</span>
                </div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: '900', letterSpacing: '1px' }}>
                    DATA_FETCHED: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            padding: '32px 24px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', gap: '16px',
                            position: 'relative', overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: `radial-gradient(circle, ${card.color} 0%, transparent 70%)`, opacity: 0.1, pointerEvents: 'none', zIndex: 1 }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                            <div style={{ color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <div style={{ fontSize: '10px', fontWeight: '900', color: card.trend.startsWith('+') ? '#00ff88' : '#ff4444', background: card.trend.startsWith('+') ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                                    {card.trend}
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ fontSize: '9px', fontWeight: '950', color: '#888', letterSpacing: '1.5px', marginBottom: '8px' }}>{card.label}</div>
                            <div style={{ fontSize: '32px', fontWeight: '950', color: '#fff', letterSpacing: '-1px' }}>{card.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area: Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '22px', marginBottom: '36px' }}>
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{ background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${revenueChartColor} 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
                        <div>
                            <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>REVENUE_OVERVIEW</h3>
                            <p style={{ fontSize: '10px', color: '#666', marginTop: '5px', fontWeight: '800' }}>LABEL EARNINGS PERFORMANCE OVER TIME</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: revenueChartColor }} />
                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#888' }}>ESTIMATED_VOLUME</span>
                            </div>
                            <div style={{ display: 'inline-flex', background: 'var(--glass)', borderRadius: '6px', padding: '4px', border: '1px solid var(--border)' }}>
                                {['3m', '6m', '12m'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r)}
                                        style={{
                                            border: 'none',
                                            background: range === r ? revenueChartColor : 'transparent',
                                            color: range === r ? '#000' : '#888',
                                            fontSize: '9px',
                                            fontWeight: '950',
                                            letterSpacing: '1px',
                                            padding: '6px 14px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <RechartsAreaChart data={chartData.map(t => ({ label: t.label, value: t.revenue }))} color={revenueChartColor} />
                    </div>
                </motion.div>

                {/* Payout Trends Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: `radial-gradient(circle, ${payoutChartColor} 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                        <div>
                            <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>PAYOUT_TRENDS</h3>
                            <p style={{ fontSize: '10px', color: '#666', marginTop: '5px', fontWeight: '800' }}>TOTAL PAYOUTS OVER TIME</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: payoutChartColor }} />
                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#888' }}>FULFILLED_PAYMENTS</span>
                        </div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <RechartsAreaChart data={(stats.payoutTrends || []).map(t => ({ label: t.label, value: t.amount }))} color={payoutChartColor} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{ background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: `radial-gradient(circle, #fff 0%, transparent 70%)`, opacity: 0.03, pointerEvents: 'none', zIndex: 1 }} />
                    <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0, position: 'relative', zIndex: 2 }}>DISTRIBUTION</h3>
                    <p style={{ fontSize: '10px', color: '#666', marginTop: '5px', marginBottom: '25px', fontWeight: '800', position: 'relative', zIndex: 2 }}>REVENUE BY PLATFORM</p>
                    <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <DonutChart data={platformData.length ? platformData : [
                            { label: 'NO_DATA', value: 1, color: '#444' }
                        ]} />
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section: Goals, Top Performers, Recent Submit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Goals */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`, opacity: 0.05, pointerEvents: 'none', zIndex: 1 }} />
                    <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '950', color: '#fff', marginBottom: '30px', position: 'relative', zIndex: 2 }}>OPERATIONAL_GOALS</h3>
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <GoalProgress label="REVENUE_TARGET" current={stats.counts.gross} target={100000} color="var(--accent)" />
                        <GoalProgress label="ARTIST_RETENTION" current={stats.counts.artists} target={1000} color="#fff" />
                        <GoalProgress label="SUBMISSION_KPI" current={200 - stats.counts.pendingDemos} target={200} color="#888" />
                    </div>
                </motion.div>

                {/* Top Performers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}
                >
                    <div style={{
                        padding: '28px 32px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative', zIndex: 2
                    }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '950', color: '#fff', margin: 0 }}>TOP_PERFORMERS</h3>
                        <Users size={18} color="#666" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
                        {stats.topArtists?.slice(0, 5).map((artist, i) => (
                            <motion.div whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} key={artist.id} style={{ padding: '20px 32px', borderBottom: i === 4 ? 'none' : '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background-color 0.2s', cursor: 'default' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '950', color: i === 0 ? 'var(--accent)' : '#666', width: '25px' }}>#{i + 1}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>{artist.name.toUpperCase()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '950', color: i === 0 ? 'var(--accent)' : '#ccc' }}>{artist.monthlyListeners?.toLocaleString() || 0}</div>
                                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '1.5px', marginTop: '4px' }}>LISTENERS</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </>
    );
}
