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
            background: 'rgba(10,10,12,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '9px', color: '#555', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: '900', color: p.color || color || '#fff' }}>
                    ${Number(p.value).toLocaleString()}
                </div>
            ))}
        </div>
    );
};

const RechartsAreaChart = ({ data, color = '#f5c542', height = 260 }) => {
    if (!data || data.length === 0) return (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '800' }}>
            NO DATA AVAILABLE
        </div>
    );

    return (
        <div style={{ width: '100%', height: `${height}px`, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: '#555', fontWeight: 700 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickFormatter={(v) => v?.includes?.('-') ? v.split('-')[1] : v}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: '#555', fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    />
                    <Tooltip content={<ChartTooltip color={color} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                        dot={{ r: 3, fill: '#0a0a0c', stroke: color, strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: color, stroke: '#0a0a0c', strokeWidth: 2 }}
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
                                        background: 'rgba(10,10,12,0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                        backdropFilter: 'blur(20px)'
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>{payload[0].name}</div>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: payload[0].payload.color }}>
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
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: color, boxShadow: `0 0 15px ${color}33` }}
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

const statCardStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px'
};

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

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff8855' }}
                    />
                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '4px' }}>SYSTEM_LIVE // ANALYTICS_REALTIME</span>
                </div>
                <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', letterSpacing: '1px' }}>
                    DATA_FETCHED: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5, scale: 1.02, background: 'rgba(255,255,255,0.04)' }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            ...statCardStyle,
                            padding: '26px',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '20px',
                            cursor: 'default',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                            <div style={{
                                width: '45px',
                                height: '45px',
                                borderRadius: '14px',
                                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.09), rgba(255,255,255,0.02))',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: card.color,
                                boxShadow: `0 0 20px ${card.color}11`
                            }}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: '900', background: 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(0,255,136,0.25)' }}>
                                    {card.trend}
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: '28px', fontWeight: '950', color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>
                            {card.value}
                        </div>

                        <div style={{ fontSize: '9px', color: '#555', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            {card.label}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area: Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '22px', marginBottom: '36px' }}>
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ ...glassStyle, padding: '28px', background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>REVENUE_OVERVIEW</h3>
                            <p style={{ fontSize: '9px', color: '#444', marginTop: '5px', fontWeight: '800' }}>LABEL EARNINGS PERFORMANCE OVER TIME</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)' }} />
                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#666' }}>ESTIMATED_VOLUME</span>
                            </div>
                            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {['3m', '6m', '12m'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r)}
                                        style={{
                                            border: 'none',
                                            background: range === r ? 'var(--accent)' : 'transparent',
                                            color: range === r ? '#000' : '#777',
                                            fontSize: '9px',
                                            fontWeight: '900',
                                            letterSpacing: '1px',
                                            padding: '7px 12px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <RechartsAreaChart data={chartData.map(t => ({ label: t.label, value: t.revenue }))} color="#f5c542" />
                </motion.div>

                {/* Payout Trends Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ ...glassStyle, padding: '28px', background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <h3 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>PAYOUT_TRENDS</h3>
                            <p style={{ fontSize: '9px', color: '#444', marginTop: '5px', fontWeight: '800' }}>TOTAL PAYOUTS OVER TIME</p>
                        </div>
                    </div>
                    <RechartsAreaChart data={(stats.payoutTrends || []).map(t => ({ label: t.label, value: t.amount }))} color="#00ff88" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ ...glassStyle, padding: '28px', background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)' }}
                >
                    <h3 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '900', color: '#fff', marginBottom: '25px' }}>PLATFORM_DISTRIBUTION</h3>
                    <DonutChart data={platformData.length ? platformData : [
                        { label: 'NO_DATA', value: 1, color: '#444' }
                    ]} />
                </motion.div>
            </div>

            {/* Bottom Section: Goals, Top Performers, Recent Submit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '22px', marginBottom: '32px' }}>
                {/* Goals */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ ...glassStyle, padding: '30px' }}
                >
                    <h3 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '900', color: '#fff', marginBottom: '25px' }}>OPERATIONAL_GOALS</h3>
                    <GoalProgress label="REVENUE_TARGET" current={stats.counts.gross} target={100000} color="var(--accent)" />
                    <GoalProgress label="ARTIST_RETENTION" current={stats.counts.artists} target={1000} color="#fff" />
                    <GoalProgress label="SUBMISSION_KPI" current={200 - stats.counts.pendingDemos} target={200} color="#444" />
                </motion.div>

                {/* Top Performers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ ...glassStyle, overflow: 'hidden' }}
                >
                    <div style={{
                        padding: '24px 30px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>TOP_PERFORMERS</h3>
                        <Users size={14} color="#555" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {stats.topArtists?.slice(0, 5).map((artist, i) => (
                            <div key={artist.id} style={{ padding: '16px 30px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#222', width: '25px' }}>#{i + 1}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{artist.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)' }}>{artist.monthlyListeners?.toLocaleString()}</div>
                                    <div style={{ fontSize: '8px', color: '#333', fontWeight: '800', letterSpacing: '1px' }}>MONTHLY_LISTENERS</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </>
    );
}
