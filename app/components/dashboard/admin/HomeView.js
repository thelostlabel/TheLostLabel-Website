import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Briefcase, CreditCard, Users, Mic2, Disc, Music,
    FileAudio, BarChart3, AlertCircle, ChevronRight, TrendingUp, Music2, RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area
} from 'recharts';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';

const DASHBOARD_THEME = {
    bg: '#0a0a0a',
    surface: '#141414',
    surfaceElevated: '#1c1c1c',
    surfaceSoft: '#2a2a2a',
    border: '#2a2a2a',
    text: '#FFFFFF',
    muted: '#888888',
    accent: '#00e5a0', // v0-ref Emerald/Mint
    accentCyan: '#00b8d4',
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
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis hide />
                        <YAxis hide />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={3}
                            fill="url(#glowGradient)"
                            isAnimationActive={true}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default function HomeView({ onNavigate }) {
    const { data: session } = useSession();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return null;
    if (!stats) return null;

    return (
        <div style={{ padding: '0 0 40px 0', fontFamily: 'Space Grotesk, sans-serif' }}>
            {/* Header Mini Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                {[
                    { label: 'Total Releases', value: stats.counts.releases },
                    { label: 'Total Tracks', value: stats.counts.songs },
                    { label: 'Total Videos', value: stats.counts.pendingDemos },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 20px', background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: DASHBOARD_THEME.muted, marginBottom: '4px' }}>{s.label}</p>
                        <p style={{ fontSize: '20px', fontWeight: '900', color: DASHBOARD_THEME.accent }}>{compactNumber(s.value)}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'start' }}>
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Welcome Banner */}
                    <div style={{
                        background: 'linear-gradient(110deg, #064e3b 0%, #134e4a 50%, #164e63 100%)',
                        borderRadius: '20px',
                        padding: '40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '220px',
                        border: `1px solid ${DASHBOARD_THEME.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 1 }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${DASHBOARD_THEME.accent}4c` }}>
                                <NextImage
                                    src={normalizeImageSrc(session?.user?.image)}
                                    width={90}
                                    height={90}
                                    alt="Avatar"
                                    unoptimized
                                    onError={handleImageError}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>Welcome to LOST, {session?.user?.stageName || 'Admin'}!</h1>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', zIndex: 1 }}>
                            <p style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: 0 }}>${(stats.counts.gross || 0).toLocaleString()}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginTop: '4px' }}>Credit Available</p>
                        </div>
                        {/* Decorative background glow */}
                        <div style={{ position: 'absolute', top: '-50%', right: '-30%', width: '100%', height: '200%', background: `radial-gradient(circle, ${DASHBOARD_THEME.accent}19 0%, transparent 60%)`, transform: 'rotate(-20deg)' }} />
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
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Recent Releases</h3>
                            <button onClick={() => onNavigate('releases')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '10px', padding: '6px 12px', borderRadius: '4px', fontWeight: '900', cursor: 'pointer' }}>SHOW ALL</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {stats.topArtists?.slice(0, 4).map((a, i) => (
                                <div key={i} style={{ cursor: 'pointer' }}>
                                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                                        <div style={{ width: '100%', height: '100%', background: `linear-gradient(45deg, #111, #222)`, position: 'relative' }}>
                                            {/* Placeholder for real images */}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                                    <p style={{ fontSize: '10px', color: DASHBOARD_THEME.muted, marginTop: '2px' }}>{a.monthlyListeners?.toLocaleString()} streams</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <CircularProgress label="Top Retailer" subtitle="Spotify" value={88} />
                    <CircularProgress label="Top Territory" subtitle="Brazil" value={63} />
                    <CircularProgress label="Listener Behaviour" subtitle="Active" value={77} />

                    {/* Total Streams Chart */}
                    <div style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '20px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', margin: 0 }}>Total Streams</h4>
                                <p style={{ fontSize: '11px', color: DASHBOARD_THEME.muted, marginTop: '4px' }}>Last 6 months</p>
                            </div>
                            <button style={{ background: 'none', border: 'none', color: DASHBOARD_THEME.accent, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>See Trends &gt;</button>
                        </div>

                        <div style={{ height: '140px', width: '100%', position: 'relative', margin: '16px 0' }}>
                            <GlowChart data={stats.listenerTrends || []} color={DASHBOARD_THEME.accent} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { name: 'Spotify', value: '124,422', color: '#1DB954' },
                                { name: 'Apple Music', value: '231,332', color: '#FA2D48' }
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: s.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{s.name}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
