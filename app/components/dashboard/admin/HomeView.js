import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Briefcase, CreditCard, Users, Mic2, Disc, Music,
    FileAudio, BarChart3, AlertCircle, ChevronRight, TrendingUp, Music2
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
    Tooltip, Area
} from 'recharts';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';

const DASHBOARD_THEME = {
    bg: '#080808',
    surface: '#0E0E0E', // Neutral Deep Grey
    surfaceElevated: '#121212',
    surfaceSoft: '#181818',
    border: 'rgba(255,255,255,0.04)',
    borderStrong: 'rgba(24,212,199,0.25)',
    text: '#FFFFFF',
    muted: '#8C98AC',
    accent: '#18D4C7',
    accentHover: '#7DEEE6',
    accentDark: '#0E746C',
    accentAlt: '#4422A5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444'
};

const CircularProgress = ({ label, subtitle, value, size = 80 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 0', borderBottom: `1px solid ${DASHBOARD_THEME.border}` }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="6"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={DASHBOARD_THEME.accent}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '13px', fontWeight: '900', color: '#fff' }}>
                    {value}%
                </div>
            </div>
            <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: DASHBOARD_THEME.accent }}>{subtitle}</p>
            </div>
        </div>
    );
};

const Sparkline = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    return (
        <div style={{ width: '60px', height: '30px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill="transparent"
                        dot={false}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const RechartsAreaChart = ({ data, color, height = 150 }) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#444', fontSize: 9, fontWeight: 700 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#444', fontSize: 9, fontWeight: 700 }}
                    tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
                        return val;
                    }}
                />
                <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontWeight: '800' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorArea)"
                    dot={{ r: 2, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: color, stroke: '#000', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default function HomeView() {
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

    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}>SYNCING_SYSTEM_DATA...</p>
            </div>
        );
    }

    if (!stats) return null;

    const topStats = [
        { label: 'Total Volume', value: `$${(stats.counts.gross || 0).toLocaleString()}`, icon: <DollarSign size={18} /> },
        { label: 'Net Revenue', value: `$${(stats.counts.revenue || 0).toLocaleString()}`, icon: <Briefcase size={18} /> },
        { label: 'Total Users', value: (stats.counts.users || 0).toLocaleString(), icon: <Users size={18} /> },
    ];

    return (
        <div className="lost-shell">
            <div className="lost-main-grid">
                {/* LEFT COLUMN */}
                <div className="lost-left-col">

                    {/* Top Stats */}
                    <div className="bc-top-stats">
                        {topStats.map((stat, i) => (
                            <div key={i} className="bc-stat-card glow-cyan">
                                <div style={{ flex: 1 }}>
                                    <span className="bc-stat-label">{stat.label}</span>
                                    <span className="bc-stat-val text-accent">{stat.value}</span>
                                </div>
                                <Sparkline data={stats.monthlyTrend || []} color={DASHBOARD_THEME.accent} />
                            </div>
                        ))}
                    </div>

                    {/* Welcome Banner */}
                    <div className="bc-welcome-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div className="bc-welcome-avatar">
                                <NextImage src={session?.user?.image || '/default-album.jpg'} alt="Admin" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: 0 }}>Welcome back, Admin!</h1>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                                    You have full access to management and <a href="/dashboard?view=my-overview" style={{ color: DASHBOARD_THEME.accent, fontWeight: '700', textDecoration: 'none' }}>your personal artist portal</a>.
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', margin: 0 }}>{stats.counts.artists || 0}</h2>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontWeight: '700' }}>Active Artists</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div className="bc-analytics-card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 className="bc-card-title">Consumer Growth</h3>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Aggregate Monthly Listeners</p>
                                </div>
                                <TrendingUp size={16} color={DASHBOARD_THEME.accent} />
                            </div>
                            <div style={{ height: '160px', width: '100%' }}>
                                <RechartsAreaChart data={stats.listenerTrends || []} color={DASHBOARD_THEME.accent} height={160} />
                            </div>
                        </div>

                        <div className="bc-analytics-card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 className="bc-card-title">Revenue Trends</h3>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Last 6 months revenue</p>
                                </div>
                                <DollarSign size={16} color={DASHBOARD_THEME.success} />
                            </div>
                            <div style={{ height: '160px', width: '100%' }}>
                                <RechartsAreaChart data={stats.trends?.map(t => ({ label: t.label, value: t.revenue })) || []} color={DASHBOARD_THEME.success} height={160} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions / System Health */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: DASHBOARD_THEME.muted, letterSpacing: '2px', marginBottom: '20px' }}>SYSTEM_MONITORING</h3>
                        <div className="bc-quick-actions">
                            <div className="bc-action-card">
                                <div className="bc-action-icon"><AlertCircle size={20} /></div>
                                <h3 className="bc-action-title">Pending Submissions</h3>
                                <p className="bc-action-desc">{stats.counts.pendingDemos} demos waiting for review</p>
                                <ChevronRight size={18} className="bc-action-arrow" />
                            </div>
                            <div className="bc-action-card">
                                <div className="bc-action-icon"><BarChart3 size={20} /></div>
                                <h3 className="bc-action-title">Open Requests</h3>
                                <p className="bc-action-desc">{stats.counts.pendingRequests} support tickets active</p>
                                <ChevronRight size={18} className="bc-action-arrow" />
                            </div>
                        </div>
                    </div>

                    {/* Artist Workspace Quick Links */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: DASHBOARD_THEME.muted, letterSpacing: '2px', marginBottom: '20px' }}>ARTIST_WORKSPACE</h3>
                        <div className="bc-quick-actions">
                            <a href="/dashboard?view=my-releases" style={{ textDecoration: 'none' }} className="bc-action-card">
                                <div className="bc-action-icon"><Disc size={20} /></div>
                                <h3 className="bc-action-title">My Releases</h3>
                                <p className="bc-action-desc">View and manage your catalog</p>
                                <ChevronRight size={18} className="bc-action-arrow" />
                            </a>
                            <a href="/dashboard?view=my-submit" style={{ textDecoration: 'none' }} className="bc-action-card">
                                <div className="bc-action-icon"><Music2 size={20} /></div>
                                <h3 className="bc-action-title">New Submission</h3>
                                <p className="bc-action-desc">Upload your latest tracks</p>
                                <ChevronRight size={18} className="bc-action-arrow" />
                            </a>
                        </div>
                    </div>

                    {/* Top Performing Artists */}
                    <div className="bc-recent-releases">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Top Performing Artists</h3>
                            <button className="bc-btn-outline">View Directory</button>
                        </div>
                        <div className="bc-artists-mini-list">
                            {stats.topArtists?.slice(0, 4).map((artist, i) => (
                                <div key={artist.id} className="admin-artist-mini-card">
                                    <div className="admin-artist-rank">#{i + 1}</div>
                                    <div className="admin-artist-info">
                                        <div className="admin-artist-name">{artist.name}</div>
                                        <div className="admin-artist-meta">{artist.monthlyListeners?.toLocaleString()} Monthly Listeners</div>
                                    </div>
                                    <div className="admin-artist-trend">
                                        <TrendingUp size={14} color={DASHBOARD_THEME.accent} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="bc-analytics-col">
                    <div className="bc-analytics-card">
                        <CircularProgress label="System Uptime" subtitle="Operational" value={99} />
                        <CircularProgress label="Processing Rate" subtitle="Stable" value={87} />

                        <div style={{ paddingTop: '24px' }}>
                            <h4 className="bc-card-title">Network Load</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: '700' }}>CURRENT</p>
                                    <p style={{ fontSize: '20px', fontWeight: '900', color: DASHBOARD_THEME.accent }}>42%</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: '700' }}>AVAILABLE</p>
                                    <p style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>58%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bc-analytics-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 className="bc-card-title">Revenue Trends</h3>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Last 6 months</p>
                            </div>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: '700' }}>See Detailed &gt;</span>
                        </div>
                        <div style={{ height: '160px', width: '100%', position: 'relative', marginBottom: '20px' }}>
                            <RechartsAreaChart data={stats.trends?.map(t => ({ label: t.label, value: t.revenue })) || []} color={DASHBOARD_THEME.accent} height={160} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1db954', display: 'grid', placeItems: 'center' }}>
                                        <Music2 size={12} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Spotify Total</span>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>{(stats.counts.songs || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .lost-shell {
                    color: #fff;
                    font-family: 'Space Grotesk', sans-serif;
                }

                .lost-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 24px;
                    align-items: start;
                }

                /* LEFT COLUMN */
                .bc-top-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .bc-stat-card {
                    background: #0E0E0E;
                    border-radius: 14px;
                    border: 1px solid ${DASHBOARD_THEME.border};
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .bc-stat-card:hover {
                    transform: translateY(-2px);
                    background: #121212;
                }
                .glow-cyan {
                    border-color: rgba(24, 212, 199, 0.08) !important;
                }
                .glow-cyan:hover {
                    border-color: rgba(24, 212, 199, 0.25) !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(24, 212, 199, 0.05);
                }
                .bc-stat-label {
                    font-size: 11px;
                    font-weight: 800;
                    color: ${DASHBOARD_THEME.muted};
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    display: block;
                }
                .bc-stat-val {
                    font-size: 28px;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                }

                .text-accent {
                    color: ${DASHBOARD_THEME.accent};
                }

                .bc-welcome-banner {
                    background: linear-gradient(110deg, #3A2396 0%, #1A114D 100%);
                    border-radius: 20px;
                    padding: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }

                .bc-welcome-banner::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -25%;
                    width: 75%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(107, 76, 246, 0.1) 0%, transparent 70%);
                    transform: rotate(-15deg);
                    pointer-events: none;
                }

                .bc-welcome-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid rgba(255, 255, 255, 0.15);
                    background: #111;
                }

                .bc-quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .bc-action-card {
                    background: #0E0E0E;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 24px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .bc-action-card:hover {
                    background: #121212;
                    transform: translateY(-2px);
                    border-color: ${DASHBOARD_THEME.accent};
                }

                .bc-action-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.03);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    color: ${DASHBOARD_THEME.accent};
                }

                .bc-action-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 6px 0;
                }

                .bc-action-desc {
                    font-size: 12px;
                    color: ${DASHBOARD_THEME.muted};
                    margin: 0;
                }

                .bc-action-arrow {
                    position: absolute;
                    top: 50%;
                    right: 20px;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.2);
                }

                .bc-artists-mini-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .admin-artist-mini-card {
                    background: #0E0E0E;
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 12px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.2s ease;
                }

                .admin-artist-mini-card:hover {
                    background: #121212;
                    border-color: rgba(255,255,255,0.1);
                }

                .admin-artist-rank {
                    font-size: 14px;
                    font-weight: 900;
                    color: ${DASHBOARD_THEME.accent};
                    width: 30px;
                }

                .admin-artist-info {
                    flex: 1;
                }

                .admin-artist-name {
                    font-size: 15px;
                    font-weight: 800;
                    color: #fff;
                }

                .admin-artist-meta {
                    font-size: 11px;
                    color: ${DASHBOARD_THEME.muted};
                    margin-top: 2px;
                }

                .bc-btn-outline {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bc-btn-outline:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: ${DASHBOARD_THEME.accent};
                }

                /* RIGHT COLUMN */
                .bc-analytics-card {
                    background: #0E0E0E;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 14px 40px rgba(0,0,0,0.3);
                }

                .bc-card-title {
                    font-size: 14px;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0;
                }

                @media (max-width: 1100px) {
                    .lost-main-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .bc-top-stats {
                        grid-template-columns: 1fr;
                    }
                    .bc-quick-actions {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
