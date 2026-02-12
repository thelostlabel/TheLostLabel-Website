"use client";
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import {
    Upload, Music, Disc, User as UserIcon, CheckCircle,
    XCircle, Clock, AlertCircle, Trash2, Send, ExternalLink,
    Briefcase, DollarSign, CreditCard, Users, ClipboardList,
    MessageSquare, ArrowLeft, SendHorizontal, BarChart3, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ProjectView from './ProjectView';

const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px',
    overflow: 'hidden'
};

const ChartTooltip = ({ active, payload, label, color }) => {
    if (!active || !payload?.length) return null;
    const isCurrency = payload[0].payload.value !== undefined && typeof payload[0].payload.value === 'number' && !label.includes('/'); // Simple heuristic for earnings vs listeners

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
                    {isCurrency ? `$${Number(p.value).toLocaleString()}` : Number(p.value).toLocaleString()}
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
            <ResponsiveContainer width="100%" height="100%">
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

const btnStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#666',
    padding: '10px 20px',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px'
};

const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    outline: 'none',
    letterSpacing: '0.5px'
};

export default function ArtistView() {
    const { data: session, update } = useSession();
    const searchParams = useSearchParams();
    const rawView = searchParams.get('view') || 'overview';
    const view = rawView.startsWith('my-') ? rawView.replace('my-', '') : rawView;

    const [demos, setDemos] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [releases, setReleases] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionRequiredContract, setActionRequiredContract] = useState(null);

    // Submit form state
    // Submit form state
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [trackLink, setTrackLink] = useState('');
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);


    useEffect(() => {
        setSelectedRequestId(searchParams.get('id'));
    }, [searchParams]);

    const [stats, setStats] = useState({ releases: 0, listeners: 0, pendingRequests: 0, earnings: 0, withdrawn: 0, balance: 0, trends: [], trendsDaily: [] });
    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/artist/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
            // Still fetch releases for the list view
            const relRes = await fetch('/api/artist/releases');
            const relData = await relRes.json();
            setReleases(Array.isArray(relData) ? relData : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [view]);

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contracts');
            const data = await res.json();
            setContracts(data.contracts || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const [earningsPagination, setEarningsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });

    const fetchEarnings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/earnings?page=${page}&limit=50`);
            const data = await res.json();
            setEarnings(data.earnings || []);
            if (data.pagination) setEarningsPagination(data.pagination);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const fetchDemos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/demo?filter=mine');
            const data = await res.json();
            setDemos(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/artist/requests');
            const data = await res.json();
            setRequests(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (view === 'overview') fetchStats();
        else if (view === 'demos') fetchDemos();
        else if (view === 'contracts') fetchContracts();
        else if (view === 'earnings') fetchEarnings();
        else if (view === 'support') fetchRequests();
        else setLoading(false);
    }, [view, fetchStats, fetchDemos, fetchContracts, fetchEarnings, fetchRequests]);

    // Check for pending contracts on load
    useEffect(() => {
        const checkPendingContracts = async () => {
            try {
                const res = await fetch('/api/contracts');
                const data = await res.json();
                const pending = (data.contracts || []).find(c => c.status === 'pending');
                if (pending) {
                    setActionRequiredContract(pending);
                }
            } catch (e) { console.error("Error checking pending contracts", e); }
        };
        if (session) checkPendingContracts();
    }, [session]);


    // File handling
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.wav'));
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.wav'));
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            showToast('Please provide a track title', 'warning');
            return;
        }

        if (files.length === 0 && !trackLink.trim()) {
            showToast('Please provide either a WAV file or a track link', 'warning');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            let uploadedFiles = [];

            // Only upload files if selected
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(f => formData.append('files', f));

                const uploadData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    // ... (existing upload logic)
                    xhr.open('POST', '/api/upload');

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(percentComplete);
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            reject(new Error('Upload failed'));
                        }
                    };

                    xhr.onerror = () => reject(new Error('Upload network error'));
                    xhr.send(formData);
                });
                uploadedFiles = uploadData.files;
            }

            // Then create demo with file references or link
            const demoRes = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    genre,
                    trackLink: trackLink.trim() || null,
                    message,
                    files: uploadedFiles
                })
            });

            if (!demoRes.ok) throw new Error('Failed to submit demo');

            showToast('Demo submitted successfully!', 'success');
            showToast('Demo submitted successfully!', 'success');
            setTitle('');
            setGenre('');
            setTrackLink('');
            setMessage('');
            setFiles([]);

            const url = new URL(window.location);
            url.searchParams.set('view', 'demos');
            window.history.pushState({}, '', url);
            window.dispatchEvent(new Event('popstate'));
            fetchDemos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const perms = session?.user?.permissions || {};
    const hasPermission = (p) => perms[p] !== false;

    const viewTitles = {
        overview: 'OVERVIEW',
        demos: 'MY DEMOS',
        support: selectedRequestId ? 'CONVERSATION' : 'SUPPORT',
        releases: 'MY RELEASES',
        submit: 'NEW SUBMISSION',
        earnings: 'MY EARNINGS',
        contracts: 'MY CONTRACTS',
        profile: 'MY PROFILE'
    };

    const viewToPerm = {
        overview: 'view_overview',
        demos: 'view_demos',
        support: 'view_support',
        releases: 'view_releases',
        submit: 'submit_demos',
        earnings: 'view_earnings',
        contracts: 'view_contracts',
        profile: 'view_profile'
    };

    if (!loading && !hasPermission(viewToPerm[view])) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
                <div style={{ padding: '30px', ...glassStyle, textAlign: 'center', maxWidth: '400px' }}>
                    <AlertCircle size={32} style={{ color: 'var(--status-error)', marginBottom: '15px' }} />
                    <h3 style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: '900', marginBottom: '10px' }}>ACCESS_RESTRICTED</h3>
                    <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
                        You do not have the required permissions to access this module. If you believe this is an error, please contact the label administration.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '30px', letterSpacing: '2px', fontWeight: '800', color: '#fff', paddingLeft: '10px' }}>
                {viewTitles[view] || 'DASHBOARD'}
            </h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', fontSize: '11px', letterSpacing: '3px', color: '#444' }}>LOADING...</div>
            ) : view === 'overview' ? (
                <OverviewView
                    stats={stats}
                    recentReleases={releases.slice(0, 4)}
                    onNavigate={(v) => {
                        const params = new URLSearchParams(window.location.search);
                        params.set('view', v);
                        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                        window.dispatchEvent(new Event('popstate'));
                    }}
                    actionRequiredContract={actionRequiredContract}
                    onSignClick={(c) => {
                        setActionRequiredContract(c);
                        setShowSignModal(true);
                    }}
                />
            ) : view === 'demos' ? (
                <DemosView demos={demos} onNavigate={(id) => {
                    const url = new URL(window.location);
                    url.searchParams.set('view', 'project');
                    url.searchParams.set('id', id);
                    window.history.pushState({}, '', url);
                    window.dispatchEvent(new Event('popstate'));
                }} />
            ) : view === 'releases' ? (
                <ReleasesView />
            ) : view === 'submit' ? (
                // ... same as before
                <SubmitView
                    title={title} setTitle={setTitle}
                    genre={genre} setGenre={setGenre}
                    trackLink={trackLink} setTrackLink={setTrackLink}
                    message={message} setMessage={setMessage}
                    files={files}
                    dragActive={dragActive}
                    handleDrag={handleDrag}
                    handleDrop={handleDrop}
                    handleFileSelect={handleFileSelect}
                    removeFile={removeFile}
                    fileInputRef={fileInputRef}
                    uploading={uploading}
                    handleSubmit={handleSubmit}
                />
            ) : view === 'earnings' ? (
                <ArtistEarningsView earnings={earnings} session={session} pagination={earningsPagination} onPageChange={fetchEarnings} />
            ) : view === 'contracts' ? (
                <ArtistContractsView contracts={contracts} session={session} />
            ) : view === 'support' ? (
                <SupportView
                    requests={requests}
                    selectedId={selectedRequestId}
                    onNavigate={(id) => {
                        const params = new URLSearchParams(window.location.search);
                        if (id) params.set('id', id);
                        else params.delete('id');
                        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                        window.dispatchEvent(new Event('popstate'));
                    }}
                />
            ) : view === 'project' ? (
                <ProjectView
                    projectId={selectedRequestId}
                    user={session?.user}
                    onBack={() => {
                        const url = new URL(window.location);
                        url.searchParams.set('view', 'demos');
                        url.searchParams.delete('id');
                        window.history.pushState({}, '', url);
                        window.dispatchEvent(new Event('popstate'));
                    }}
                />
            ) : view === 'profile' ? (
                <ProfileView onUpdate={update} />
            ) : null}

            {/* Signing Modal removed per user request */}
        </div>
    );
}

// ... (Existing)

const GoalProgress = ({ label, current, target, color }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const safeColor = color || 'var(--accent)';
    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#555' }}>{Number(current).toLocaleString()} / {Number(target).toLocaleString()}</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: safeColor }}>{percentage}%</span>
                </div>
            </div>
            <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: safeColor, borderRadius: '10px', boxShadow: `0 0 18px ${safeColor}50` }}
                />
            </div>
        </div>
    );
};

function SimpleChart({ data, color = 'var(--accent)' }) {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const rawMax = Math.max(...values, 10);
    const rawMin = Math.min(...values, 0);
    const padding = Math.max((rawMax - rawMin) * 0.15, rawMax * 0.1, 10);
    const maxVal = rawMax + padding;
    const minVal = Math.max(rawMin - padding, 0);
    const range = Math.max(maxVal - minVal, 1);

    const getCoords = (i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 85 - ((data[i].value - minVal) / range) * 70;
        return { x, y };
    };

    const pathData = `M ${getCoords(0).x} ${getCoords(0).y} ` +
        Array.from({ length: data.length - 1 }).map((_, i) => {
            const curr = getCoords(i);
            const next = getCoords(i + 1);
            const cp1x = curr.x + (next.x - curr.x) / 2;
            return `C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
        }).join(" ");

    const areaPath = `${pathData} L 100 100 L 0 100 Z`;
    const lastValue = Number(data[data.length - 1]?.value || 0);
    const yTicks = [0, 25, 50, 75, 100];

    return (
        <div style={{ width: '100%', height: '240px', position: 'relative', marginTop: '20px' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="areaGradientArtist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Labels */}
                {yTicks.map(val => (
                    <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                ))}
                {yTicks.map(val => (
                    <text key={`y-${val}`} x="-2" y={val + 1.5} textAnchor="end" fill="#444" fontSize="7" fontWeight="700">
                        {Math.round(maxVal - ((val / 100) * range)).toLocaleString()}
                    </text>
                ))}

                <motion.path
                    d={areaPath}
                    fill="url(#areaGradientArtist)"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1.2 }}
                />

                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                    vectorEffect="non-scaling-stroke"
                    style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
                />
            </svg>

            {/* Floating Badge (HTML Overlay) */}
            <div style={{
                position: 'absolute',
                right: '10px',
                top: '0px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)'
            }}>
                ${lastValue.toLocaleString()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', padding: '0 5px' }}>
                {data.filter((_, i) => i % 2 === 0).map((d, i) => (
                    <span key={i} style={{ fontSize: '8px', color: '#666', fontWeight: '900', letterSpacing: '1px' }}>{d.label.toUpperCase()}</span>
                ))}
            </div>
        </div>
    );
}

function OverviewView({ stats, recentReleases, onNavigate, actionRequiredContract, onSignClick }) {
    const [chartRange, setChartRange] = useState('monthly'); // monthly | daily
    const [chartType, setChartType] = useState('earnings'); // earnings | listeners

    const chartData = chartType === 'listeners'
        ? (stats.listenerTrend || [])
        : (chartRange === 'daily'
            ? (stats.trendsDaily && stats.trendsDaily.length ? stats.trendsDaily : stats.trends)
            : stats.trends);

    const chartTitle = chartType === 'listeners' ? 'GROWTH FLOW' : 'PERFORMANCE FLOW';
    const chartColor = chartType === 'listeners' ? '#00d4ff' : 'var(--accent)';
    const chartSubtitle = chartType === 'listeners'
        ? 'Your monthly listeners growth day by day'
        : (chartRange === 'daily'
            ? 'Estimated earnings trend by day (Last 30)'
            : 'Estimated earnings trend by month');

    // --- Hero / Welcome Section ---
    const userFirstName = stats.artistName?.split(' ')[0] || 'Artist';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

            {/* 1. Hero Welcome Area with Blurred Glow */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    position: 'relative',
                    padding: '40px 0',
                    textAlign: 'center',
                    marginBottom: '10px'
                }}
            >
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '60%', height: '100%',
                    background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)', zIndex: -1
                }} />

                <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1px', color: '#fff', marginBottom: '10px' }}>
                    Welcome back, <span style={{ color: 'var(--accent)' }}>{userFirstName}</span>
                </h1>
                <p style={{ fontSize: '13px', color: '#888', letterSpacing: '1px', fontWeight: '500' }}>
                    Here's what's happening with your music today.
                </p>
            </motion.div>

            {/* 2. Key Metrics Grid (Redesigned) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
                {[
                    { label: 'MONTHLY LISTENERS', value: stats.listeners?.toLocaleString() || '0', icon: <Users size={18} />, color: '#fff' },
                    { label: 'TOTAL STREAMS', value: stats.streams ? stats.streams.toLocaleString() : '0', icon: <Music size={18} />, color: '#fff' },
                    { label: 'PENDING DEMOS', value: stats.demos || '0', icon: <Clock size={18} />, color: stats.demos > 0 ? '#ffaa00' : '#666' },
                    { label: 'WALLET BALANCE', value: `$${(stats.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`, icon: <DollarSign size={18} />, color: 'var(--accent)', highlight: true }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                        style={{
                            ...glassStyle,
                            padding: '24px',
                            background: card.highlight ? 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)' : 'rgba(255,255,255,0.02)',
                            border: card.highlight ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
                            display: 'flex', flexDirection: 'column', gap: '12px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: card.color }}>
                                {card.icon}
                            </div>
                            {card.trend && <span style={{ fontSize: '9px', fontWeight: '800', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '4px 8px', borderRadius: '8px' }}>{card.trend}</span>}
                        </div>
                        <div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{card.value}</div>
                            <div style={{ fontSize: '9px', fontWeight: '800', color: '#555', letterSpacing: '1px', marginTop: '4px' }}>{card.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 3. Main Dashboard Content (Chart + Spotlight) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Performance Chart */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ ...glassStyle, padding: '30px', minHeight: '350px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '13px', letterSpacing: '2px', fontWeight: '900', color: '#fff' }}>{chartTitle}</h3>
                            <p style={{ fontSize: '10px', color: '#555', marginTop: '4px', fontWeight: '700' }}>{chartSubtitle}</p>
                        </div>
                        {/* Toggle Buttons */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                                {['earnings', 'listeners'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type)}
                                        style={{
                                            border: 'none',
                                            background: chartType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            color: chartType === type ? '#fff' : '#666',
                                            fontSize: '9px',
                                            fontWeight: '800',
                                            padding: '6px 14px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {type === 'earnings' ? 'EARNINGS' : 'GROWTH'}
                                    </button>
                                ))}
                            </div>

                            {chartType === 'earnings' && (
                                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                                    {['monthly', 'daily'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setChartRange(mode)}
                                            style={{
                                                border: 'none',
                                                background: chartRange === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                color: chartRange === mode ? '#fff' : '#666',
                                                fontSize: '9px',
                                                fontWeight: '800',
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {mode.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* The Chart */}
                    <div style={{ height: '280px' }}>
                        {chartData && chartData.length > 0 ? (
                            <RechartsAreaChart data={chartData} color={chartColor} height={280} />
                        ) : (
                            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {chartType === 'earnings' ? <DollarSign size={16} color="#333" /> : <Users size={16} color="#333" />}
                                </div>
                                <div style={{ color: '#444', fontSize: '10px', letterSpacing: '1px', fontWeight: '800' }}>
                                    {chartType === 'earnings' ? 'NO EARNINGS DATA YET' : 'NO GROWTH DATA YET'}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Spotlight / Goals Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Featured Release Card (Visual Show) */}
                    {recentReleases[0] && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                ...glassStyle,
                                padding: '0',
                                overflow: 'hidden',
                                position: 'relative',
                                height: '220px'
                            }}
                        >
                            {/* Background Image with Blur */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: `url(${recentReleases[0].image || '/default-album.jpg'})`,
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                filter: 'blur(20px) brightness(0.4)', zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', color: '#fff', letterSpacing: '1px' }}>LATEST DROP</span>
                                    <ExternalLink size={14} color="#fff" style={{ opacity: 0.7 }} />
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                                        <NextImage src={recentReleases[0].image || '/default-album.jpg'} width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Art" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', margin: 0 }}>{recentReleases[0].name}</h4>
                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{recentReleases[0].type.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Goals Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ ...glassStyle, padding: '24px', flex: 1 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '900', color: '#fff', margin: 0 }}>NEXT MILESTONES</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <GoalProgress label="EARNINGS ($5K)" current={stats.balance} target={5000} color="var(--accent)" />
                            <GoalProgress label="RELEASES (12)" current={stats.releases} target={12} color="#00d4ff" />
                            <GoalProgress label="10K LISTENERS" current={stats.listeners || 0} target={10000} color="#ff0055" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Action Required Banner (if any) */}
            {actionRequiredContract && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.02) 100%)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '-10px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '50%' }}>
                            <AlertCircle size={20} color="#eab308" />
                        </div>
                        <div>
                            <h4 style={{ color: '#eab308', fontSize: '13px', fontWeight: '800', margin: 0 }}>ACTION REQUIRED</h4>
                            <p style={{ color: '#aaa', fontSize: '11px', margin: '4px 0 0' }}>You have a pending contract for "{actionRequiredContract.title}" waiting for signature.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onSignClick(actionRequiredContract)}
                        style={{ ...btnStyle, background: '#eab308', color: '#000', border: 'none', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)' }}
                    >
                        REVIEW & SIGN
                    </button>
                </motion.div>
            )}


            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff' }}>RECENT_RELEASES</h3>
                        <button
                            onClick={() => onNavigate('releases')}
                            style={{ background: 'none', border: 'none', color: '#444', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer' }}>
                            VIEW ALL
                        </button>
                    </div>

                    {recentReleases.length === 0 ? (
                        <div style={{ ...glassStyle, padding: '40px', textAlign: 'center', color: '#444' }}>
                            <p style={{ fontSize: '10px', letterSpacing: '2px' }}>NO RELEASES TO SHOW</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                            {recentReleases.map(r => (
                                <div key={r.id} style={{ ...glassStyle, padding: '10px' }}>
                                    <div style={{ aspectRatio: '1/1', background: '#111', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <NextImage src={r.image} alt={r.name} width={140} height={140} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name.toUpperCase()}</div>
                                    <div style={{ fontSize: '8px', color: '#444', marginTop: '4px' }}>{new Date(r.releaseDate).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff', marginBottom: '20px' }}>QUICK_REACH</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => onNavigate('submit')}
                                style={{ ...btnStyle, width: '100%', background: 'rgba(255,255,255,0.03)', color: '#fff', justifyContent: 'center', padding: '18px' }}>
                                <Upload size={14} style={{ color: 'var(--accent)' }} /> SUBMIT NEW TRACK
                            </button>
                            <button
                                onClick={() => onNavigate('profile')}
                                style={{ ...btnStyle, width: '100%', background: 'transparent', justifyContent: 'center', padding: '18px' }}>
                                <UserIcon size={14} /> MANAGE PROFILE
                            </button>
                        </div>
                    </div>

                    <div style={{ ...glassStyle, padding: '25px', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
                        <div style={{ color: 'var(--accent)', fontSize: '9px', fontWeight: '900', letterSpacing: '2px', marginBottom: '12px' }}>NEED HELP?</div>
                        <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.6', marginBottom: '15px' }}>Have questions about your release or earnings? Our team is here to support you.</p>
                        <button
                            onClick={() => onNavigate('releases')}
                            style={{ ...btnStyle, width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '8px' }}>
                            START CONVERSATION
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .stat-card:hover {
                    background: rgba(255,255,255,0.03) !important;
                    border-color: rgba(255,255,255,0.1) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}

function ReleasesView() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestModal, setRequestModal] = useState(null); // { releaseId, releaseName }
    const [requestType, setRequestType] = useState('question');
    const [requestDetails, setRequestDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewingRequest, setViewingRequest] = useState(null); // Full request object for conversation
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReleases();
    }, []);

    const fetchReleases = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/artist/releases');
            const data = await res.json();
            if (res.ok) {
                setReleases(Array.isArray(data) ? data : []);
            } else {
                setError(data.error);
            }
        } catch (e) {
            console.error(e);
            setError('FAILED TO CONNECT');
        } finally { setLoading(false); }
    };

    const handleRequestSubmit = async () => {
        if (!requestDetails.trim()) {
            alert('Please provide details for your request.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/artist/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    releaseId: requestModal.releaseId,
                    type: requestType,
                    details: requestDetails
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Request submitted successfully!');
                setRequestModal(null);
                setRequestDetails('');
                fetchReleases(); // Refresh to show pending status
            } else {
                alert(data.error || 'Request failed');
            }
        } catch (e) { alert('Request failed'); }
        finally { setSubmitting(false); }
    };

    const getRequestStatus = (release) => {
        if (!release.requests || release.requests.length === 0) return null;

        // Sort requests by updatedAt to get the most recent active one
        const sorted = [...release.requests].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Find the most relevant active request (exclude rejected ones if there's an active one)
        const active = sorted.find(r => r.status !== 'rejected');
        if (active) return active;

        // If all are rejected, show the last rejected one
        return sorted[0];
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#444' }}>Loading releases...</div>;

    return (
        <div>
            {requestModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{ ...glassStyle, padding: '30px', width: '450px' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '10px', letterSpacing: '2px', fontWeight: '800' }}>REQUEST CHANGE</h3>
                        <p style={{ fontSize: '11px', color: '#666', marginBottom: '25px', letterSpacing: '1px' }}>
                            FOR: <strong style={{ color: '#fff' }}>{requestModal.releaseName.toUpperCase()}</strong>
                        </p>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>REQUEST TYPE</label>
                            <select value={requestType} onChange={(e) => setRequestType(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '13px' }}>
                                <option value="question">Question / Help / Support</option>
                                <option value="cover_art">Update Cover Art</option>
                                <option value="audio">Update Audio File</option>
                                <option value="delete">Request Takedown (Delete)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>DETAILS / LINKS</label>
                            <textarea
                                value={requestDetails}
                                onChange={(e) => setRequestDetails(e.target.value)}
                                placeholder="Describe your request. For files, provide a Dropbox/Drive link."
                                rows={4}
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleRequestSubmit} disabled={submitting} className="glow-button" style={{ flex: 1, padding: '12px' }}>
                                {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                            </button>
                            <button onClick={() => setRequestModal(null)} style={{ ...btnStyle, flex: 1, padding: '12px' }}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error === 'Spotify URL not set' ? (
                <div style={{ textAlign: 'center', padding: '80px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <AlertCircle size={40} color="var(--accent)" style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <p style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '900', color: '#fff' }}>SPOTIFY_PROFILE_REQUIRED</p>
                    <p style={{ fontSize: '10px', marginTop: '10px', color: '#666', maxWidth: '400px', margin: '15px auto', lineHeight: '1.6' }}>
                        To sync your catalog, please add your Spotify Artist URL in the Profile tab. This allows us to link your releases to your dashboard.
                    </p>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            // My change: Use 'my-profile' instead of 'profile'
                            params.set('view', 'my-profile');
                            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                            window.dispatchEvent(new Event('popstate'));
                        }}
                        style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 30px', marginTop: '10px' }}>
                        GO TO PROFILE
                    </button>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--status-error)' }}>
                    <p style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '900' }}>ERROR: {error.toUpperCase()}</p>
                    <button onClick={fetchReleases} style={{ ...btnStyle, marginTop: '20px' }}>RETRY_SYNC</button>
                </div>
            ) : releases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#444' }}>
                    <p style={{ fontSize: '12px', letterSpacing: '2px' }}>NO RELEASES FOUND</p>
                    <p style={{ fontSize: '10px', marginTop: '10px', color: '#666' }}>Your releases will appear here once distributed.</p>
                </div>
            ) : (

                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* UPCOMING RELEASES */}
                    {releases.some(r => new Date(r.releaseDate) > new Date()) && (
                        <div>
                            <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff', marginBottom: '20px', paddingLeft: '5px', borderLeft: '2px solid var(--accent)' }}>UPCOMING_RELEASES</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                {releases.filter(r => new Date(r.releaseDate) > new Date()).map(release => (
                                    <ReleaseCard key={release.id} release={release} getRequestStatus={getRequestStatus} setRequestModal={setRequestModal} onNavigate={(id) => {
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('view', 'support');
                                        params.set('id', id);
                                        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                                        window.dispatchEvent(new Event('popstate'));
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DISCOGRAPHY / PAST RELEASES */}
                    <div>
                        <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff', marginBottom: '20px', paddingLeft: '5px', borderLeft: '2px solid #555' }}>DISCOGRAPHY</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {releases.filter(r => new Date(r.releaseDate) <= new Date()).map(release => (
                                <ReleaseCard key={release.id} release={release} getRequestStatus={getRequestStatus} setRequestModal={setRequestModal} onNavigate={(id) => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('view', 'support');
                                    params.set('id', id);
                                    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                                    window.dispatchEvent(new Event('popstate'));
                                }} />
                            ))}
                            {releases.filter(r => new Date(r.releaseDate) <= new Date()).length === 0 && (
                                <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', padding: '20px' }}>No released tracks yet.</div>
                            )}
                        </div>
                    </div>

                </div>
            )
            }
        </div >
    );
}

function ReleaseCard({ release, getRequestStatus, setRequestModal, onNavigate }) {
    const activeRequest = getRequestStatus(release);

    return (
        <div style={{ ...glassStyle, padding: '15px' }}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', marginBottom: '15px', overflow: 'hidden' }}>
                {release.image ? (
                    <NextImage src={release.image?.startsWith('private/') ? `/api/files/release/${release.id}` : release.image} alt={release.name} width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>NO ART</div>
                )}
            </div>
            <h3 style={{ fontSize: '13px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{release.name}</h3>
            <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }}>{new Date(release.releaseDate || release.createdAt).toLocaleDateString()}</p>

            {(() => {
                if (activeRequest) {
                    const isApproved = activeRequest.status === 'approved' || activeRequest.status === 'completed';
                    const isRejected = activeRequest.status === 'rejected';

                    const getStatusLabel = (s) => {
                        if (s === 'approved') return 'APPROVED';
                        if (s === 'processing') return 'PROCESSING';
                        if (s === 'reviewing') return 'UNDER REVIEW';
                        if (s === 'completed') return 'COMPLETED';
                        if (s === 'rejected') return 'REJECTED';
                        return 'PENDING';
                    };

                    const getStatusColor = (s) => {
                        if (s === 'approved' || s === 'completed') return 'var(--status-success)';
                        if (s === 'processing') return 'var(--status-info)';
                        if (s === 'reviewing') return 'var(--status-warning)';
                        if (s === 'rejected') return 'var(--status-error)';
                        return 'var(--status-neutral)';
                    };

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isApproved ? 'var(--status-success-bg)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '9px', color: getStatusColor(activeRequest.status), fontWeight: '900', letterSpacing: '1px' }}>
                                        {getStatusLabel(activeRequest.status)}
                                    </span>
                                    <span style={{ fontSize: '8px', color: '#444' }}>{new Date(activeRequest.updatedAt).toLocaleDateString()}</span>
                                </div>

                                <div style={{ fontSize: '11px', color: '#fff', fontWeight: '800', marginBottom: '4px' }}>
                                    {activeRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                                </div>

                                {activeRequest.adminNote && (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        color: '#888',
                                        lineHeight: '1.4'
                                    }}>
                                        <strong style={{ color: '#aaa', fontSize: '8px', display: 'block', marginBottom: '2px' }}>NOTE:</strong>
                                        {activeRequest.adminNote}
                                    </div>
                                )}

                                {!isRejected && !isApproved && activeRequest.status !== 'completed' && (
                                    <div style={{ fontSize: '9px', color: '#444', marginTop: '8px', fontStyle: 'italic' }}>
                                        Request is being reviewed by the team.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onNavigate(activeRequest.id)}
                                style={{ ...btnStyle, width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                            >
                                VIEW CONVERSATION
                            </button>
                        </div>
                    );
                } else {
                    return (
                        <button
                            onClick={() => setRequestModal({ releaseId: release.id, releaseName: release.name })}
                            style={{ ...btnStyle, width: '100%', padding: '10px' }}
                        >
                            REQUEST CHANGE
                        </button>
                    );
                }
            })()}
        </div>
    );
}

function SupportView({ requests, selectedId, onNavigate }) {
    const selectedRequest = requests.find(r => r.id === selectedId);
    const [isCreating, setIsCreating] = useState(false);

    if (selectedRequest) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <button
                    onClick={() => onNavigate(null)}
                    style={{ ...btnStyle, alignSelf: 'flex-start', background: 'transparent' }}
                >
                    <ArrowLeft size={14} /> BACK TO SUPPORT
                </button>

                <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>
                                {selectedRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{selectedRequest.release?.name || 'Support Ticket'}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>STATUS</div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{selectedRequest.status.toUpperCase()}</div>
                        </div>
                    </div>

                    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <RequestComments request={selectedRequest} isArtist />
                    </div>
                </div>
            </div>
        );
    }

    if (isCreating) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <button
                    onClick={() => setIsCreating(false)}
                    style={{ ...btnStyle, alignSelf: 'flex-start', background: 'transparent' }}
                >
                    <ArrowLeft size={14} /> CANCEL
                </button>
                <div style={glassStyle}>
                    <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '900' }}>CREATE_NEW_SUPPORT_TICKET</h3>
                    </div>
                    <CreateSupportForm onComplete={() => { setIsCreating(false); onNavigate(null); window.location.reload(); }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button
                    onClick={() => setIsCreating(true)}
                    style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none' }}
                >
                    + NEW SUPPORT TICKET
                </button>
            </div>
            {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                    <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#444' }}>NO ACTIVE SUPPORT REQUESTS</p>
                </div>
            ) : (
                requests.map(req => (
                    <div
                        key={req.id}
                        onClick={() => onNavigate(req.id)}
                        style={{
                            ...glassStyle,
                            padding: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '20px',
                            transition: 'all 0.2s',
                            background: 'rgba(255,255,255,0.01)'
                        }}
                        className="support-item"
                    >
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={16} color="#666" />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                                    {req.release?.name || 'Support Ticket'}
                                </h4>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px' }}>
                                        {req.type.toUpperCase().replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#555' }}>•</span>
                                    <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                                        {req.details}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span style={{ fontSize: '9px', color: '#444' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                            <div style={{
                                padding: '4px 8px', borderRadius: '4px',
                                background: req.status === 'completed' ? 'var(--status-success-bg)' : 'rgba(255,255,255,0.05)',
                                color: req.status === 'completed' ? 'var(--status-success)' : '#888',
                                fontSize: '9px', fontWeight: '900'
                            }}>
                                {req.status === 'pending' ? 'OPEN' : req.status.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))
            )}
            <style jsx>{`
                .support-item:hover { background: rgba(255,255,255,0.04) !important; }
            `}</style>
        </div>
    );
}

function CreateSupportForm({ onComplete }) {
    const [type, setType] = useState('general_support');
    const [details, setDetails] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!details.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/artist/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, details })
            });
            if (res.ok) {
                onComplete();
            } else {
                alert('Failed to submit ticket');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred');
        } finally {
            setSending(false);
        }
    };

    const labelStyle = { display: 'block', fontSize: '9px', letterSpacing: '2px', color: '#555', marginBottom: '8px', fontWeight: '900' };
    const inputStyle = { width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none' };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={labelStyle}>REQUEST_TYPE</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                    <option value="general_support">GENERAL SUPPORT</option>
                    <option value="metadata_correction">METADATA CORRECTION</option>
                    <option value="technical_issue">TECHNICAL ISSUE</option>
                    <option value="earnings_billing">EARNINGS / BILLING</option>
                    <option value="take_down">TAKE DOWN REQUEST</option>
                    <option value="marketing_request">MARKETING REQUEST</option>
                </select>
            </div>
            <div>
                <label style={labelStyle}>DETAILS_AND_MESSAGE</label>
                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    required
                    rows={6}
                    style={{ ...inputStyle, resize: 'none' }}
                />
            </div>
            <button
                type="submit"
                disabled={sending || !details.trim()}
                className="glow-button"
                style={{ height: '50px', marginTop: '10px' }}
            >
                {sending ? 'SUBMITTING...' : 'OPEN TICKET'}
            </button>
        </form>
    );
}

function RequestComments({ request, isArtist }) {
    const requestId = request.id;
    const { data: session } = useSession();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchComments();
    }, [requestId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            const data = await res.json();
            if (res.ok) {
                setComments([...comments, data]);
                setNewComment('');
            }
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    if (loading) return <div style={{ fontSize: '11px', color: '#444', padding: '100px', textAlign: 'center', letterSpacing: '2px' }}>LOADING_CONVERSATION...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
                <div style={{ alignSelf: 'center', margin: '20px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#333', letterSpacing: '3px' }}>CONVERSATION_STARTED</div>
                    <div style={{ fontSize: '8px', color: '#222', marginTop: '5px' }}>{new Date(request.createdAt).toLocaleString()}</div>
                </div>

                {/* Artist's initial description */}
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: 'var(--accent)', color: '#000', padding: '15px 20px', borderRadius: '15px 15px 2px 15px', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', lineHeight: '1.5' }}>{request.details}</div>
                    <div style={{ fontSize: '8px', opacity: 0.5, marginTop: '8px', fontWeight: '900', textAlign: 'right' }}>YOU (INITIAL)</div>
                </div>

                {comments.map(c => {
                    const isMe = c.userId === session?.user?.id;
                    const isStaff = c.user.role === 'admin' || c.user.role === 'a&r';

                    return (
                        <div key={c.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                            background: isMe ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                            padding: '15px 20px',
                            borderRadius: isMe ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {!isMe && (
                                <div style={{ fontSize: '8px', fontWeight: '900', color: isStaff ? 'var(--accent)' : '#666', marginBottom: '8px', letterSpacing: '1px' }}>
                                    {c.user.stageName?.toUpperCase() || 'EXTERNAL'} {isStaff ? '(STAFF)' : ''}
                                </div>
                            )}
                            <div style={{ fontSize: '12px', lineHeight: '1.6', color: isMe ? '#fff' : '#aaa' }}>{c.content}</div>
                            <div style={{ fontSize: '8px', color: '#333', marginTop: '10px', fontWeight: '800', textAlign: isMe ? 'right' : 'left' }}>
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '15px' }}>
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    style={{ ...inputStyle, flex: 1 }}
                />
                <button
                    disabled={sending || !newComment.trim()}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '0 25px' }}
                >
                    {sending ? '...' : 'SEND'}
                </button>
            </form>
        </div>
    );
}

function DemosView({ demos, onNavigate }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--status-success)';
            case 'rejected': return 'var(--status-error)';
            case 'reviewing': return 'var(--status-warning)';
            default: return 'var(--status-neutral)';
        }
    };

    return (
        <div>
            {demos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#444' }}>
                    <p style={{ fontSize: '12px', letterSpacing: '2px', marginBottom: '20px' }}>NO DEMOS SUBMITTED YET</p>
                    <a href="/dashboard?view=submit" className="glow-button" style={{ padding: '12px 30px' }}>
                        SUBMIT YOUR FIRST DEMO
                    </a>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {demos.map(demo => (
                        <div
                            key={demo.id}
                            onClick={() => onNavigate && onNavigate(demo.id)}
                            style={{ ...glassStyle, padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>{demo.title}</h3>
                                    <p style={{ fontSize: '11px', color: '#666' }}>{demo.genre || 'No genre specified'}</p>
                                    <p style={{ fontSize: '10px', color: '#444', marginTop: '5px' }}>
                                        Submitted: {new Date(demo.createdAt).toLocaleDateString()}
                                    </p>
                                    {demo.files && demo.files.length > 0 && (
                                        <p style={{ fontSize: '9px', color: '#555', marginTop: '5px' }}>
                                            📁 {demo.files.length} file(s) attached
                                        </p>
                                    )}
                                    {demo.status === 'rejected' && demo.rejectionReason && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error)', borderRadius: '4px', maxWidth: '400px' }}>
                                            <p style={{ fontSize: '9px', color: 'var(--status-error)', fontWeight: '800', marginBottom: '4px', letterSpacing: '1px' }}>REJECTION REASON</p>
                                            <p style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>{demo.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    letterSpacing: '1px',
                                    color: getStatusColor(demo.status),
                                    padding: '5px 12px',
                                    border: `1px solid ${getStatusColor(demo.status)}`,
                                    borderRadius: '2px'
                                }}>
                                    {demo.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SubmitView({
    title, setTitle,
    genre, setGenre,
    trackLink, setTrackLink,
    message, setMessage,
    files,
    dragActive, handleDrag, handleDrop, handleFileSelect, removeFile, fileInputRef,
    uploading, handleSubmit
}) {
    const [genres, setGenres] = useState(['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Other']);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await fetch('/api/settings/public');
                const data = await res.json();
                if (data.genres) setGenres(data.genres);
            } catch (e) { console.error('Failed to fetch genres:', e); }
        };
        fetchGenres();
    }, []);

    const labelStyle = { display: 'block', fontSize: '9px', letterSpacing: '2px', color: '#555', marginBottom: '8px', fontWeight: '900' };
    const inputStyle = { width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ ...glassStyle, padding: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
                    <div>
                        <label style={labelStyle}>TRACK_TITLE *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="TITLE"
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>GENRE / VIBE</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle}>
                            <option value="">Select Genre</option>
                            {genres.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={labelStyle}>TRACK_LINK (OPTIONAL)</label>
                    <input
                        type="url"
                        value={trackLink}
                        onChange={(e) => setTrackLink(e.target.value)}
                        placeholder="https://soundcloud.com/..."
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={labelStyle}>MESSAGE_FOR_AR (OPTIONAL)</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about this record..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={labelStyle}>MASTERED_AUDIO (WAV ONLY) *</label>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
                            padding: '50px 30px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragActive ? 'rgba(var(--accent-rgb), 0.05)' : 'rgba(255,255,255,0.01)',
                            borderRadius: '16px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div style={{ marginBottom: '15px' }}>
                            <Upload size={32} style={{ color: dragActive ? 'var(--accent)' : '#333' }} />
                        </div>
                        <p style={{ color: '#888', fontSize: '12px', fontWeight: '500' }}>
                            {dragActive ? 'DROP_FILE_NOW' : 'DRAG & DROP WAV OR CLICK_TO_BROWSE'}
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".wav"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {files.length > 0 && (
                        <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                            {files.map((file, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 20px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', borderRadius: '8px' }}>
                                            <Music size={14} />
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                                            {file.name} <span style={{ color: '#555', marginLeft: '6px' }}>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: '5px' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                    }
                </div >

                <div style={{ marginTop: '40px' }}>
                    {uploading ? (
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '2px', color: 'var(--accent)' }}>UPLOADING_TRACK...</span>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff' }}>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '18px',
                                background: 'var(--accent)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: '900',
                                letterSpacing: '4px',
                                cursor: 'pointer',
                                transition: '0.3s'
                            }}
                            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                        >
                            SUBMIT_DEMO
                        </button>
                    )}
                </div>
            </div >
        </form >
    );
}


function ProfileView({ onUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [stageName, setStageName] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');

    // Notification Preferences
    const [notifyDemos, setNotifyDemos] = useState(true);
    const [notifyEarnings, setNotifyEarnings] = useState(true);
    const [notifySupport, setNotifySupport] = useState(true);
    const [notifyContracts, setNotifyContracts] = useState(true);

    const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#666', marginBottom: '8px', fontWeight: '800' };
    const inputStyle = { width: '100%', padding: '12px 15px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', fontSize: '13px' };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            setProfile(data);
            setFullName(data.fullName || '');
            setStageName(data.stageName || '');
            setSpotifyUrl(data.spotifyUrl || '');

            // Set prefs (default to true if undefined, though DB default is true)
            setNotifyDemos(data.notifyDemos !== false);
            setNotifyEarnings(data.notifyEarnings !== false);
            setNotifySupport(data.notifySupport !== false);
            setNotifyContracts(data.notifyContracts !== false);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName, stageName, spotifyUrl,
                    notifyDemos, notifyEarnings, notifySupport, notifyContracts
                })
            });
            if (res.ok) {
                if (onUpdate) await onUpdate({ user: { fullName, stageName, spotifyUrl } });
                alert('Profile updated successfully!');
            } else {
                alert('Failed to save profile');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save profile');
        } finally { setSaving(false); }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '80px', color: '#444' }}>Loading profile...</div>;
    }

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ ...glassStyle, padding: '40px' }}>
                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>EMAIL</label>
                    <input
                        type="text"
                        value={profile?.email || ''}
                        disabled
                        style={{ ...inputStyle, background: 'rgba(255,255,255,0.01)', color: '#666', cursor: 'not-allowed' }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>FULL NAME</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="YOUR FULL NAME"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>STAGE NAME / ARTIST NAME</label>
                    <input
                        type="text"
                        value={stageName}
                        onChange={(e) => setStageName(e.target.value)}
                        placeholder="YOUR ARTIST NAME"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>SPOTIFY PROFILE URL</label>
                    <input
                        type="url"
                        value={spotifyUrl}
                        onChange={(e) => setSpotifyUrl(e.target.value)}
                        placeholder="HTTPS://OPEN.SPOTIFY.COM/ARTIST/..."
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <label style={{ ...labelStyle, marginBottom: '15px', color: '#fff' }}>EMAIL NOTIFICATIONS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {[
                            { label: 'DEMO UPDATES', state: notifyDemos, set: setNotifyDemos, desc: 'Get notified when we receive or review your demos.' },
                            { label: 'NEW CONTRACTS', state: notifyContracts, set: setNotifyContracts, desc: 'Receive emails when new contracts are created for you.' },
                            { label: 'EARNINGS REPORTS', state: notifyEarnings, set: setNotifyEarnings, desc: 'Monthly updates about your royalties and payouts.' },
                            { label: 'SUPPORT TICKETS', state: notifySupport, set: setNotifySupport, desc: 'Updates on your help requests and account status.' }
                        ].map((item, i) => (
                            <div key={i}
                                onClick={() => item.set(!item.state)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px', borderRadius: '8px',
                                    background: item.state ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                    border: item.state ? '1px solid rgba(0, 255, 136, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer', transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '16px', height: '16px', borderRadius: '4px',
                                    border: item.state ? 'none' : '2px solid #444',
                                    background: item.state ? 'var(--status-success)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {item.state && <CheckCircle size={10} color="#000" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: item.state ? '#fff' : '#888' }}>{item.label}</div>
                                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="glow-button"
                    style={{ width: '100%', padding: '15px', opacity: saving ? 0.5 : 1, fontWeight: '900', letterSpacing: '2px' }}
                >
                    {saving ? 'SAVING...' : 'SAVE PROFILE'}
                </button>
            </div>

            <p style={{ marginTop: '30px', fontSize: '10px', color: '#444', textAlign: 'center', letterSpacing: '1px' }}>
                MEMBER SINCE: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'UNKNOWN'}
            </p>
        </div>
    );
}

function ArtistEarningsView({ earnings, session, pagination, onPageChange }) {
    const calculateUserShare = (e) => {
        if (!e.contract?.splits || e.contract.splits.length === 0) return e.artistAmount;

        const userSplits = e.contract.splits.filter(s =>
            s.userId === session?.user?.id ||
            (s.artistId && session?.user?.artist?.id === s.artistId) ||
            (s.user?.email && s.user.email === session?.user?.email) ||
            (s.name && (
                s.name.toLowerCase() === session?.user?.email?.toLowerCase() ||
                s.name.toLowerCase() === session?.user?.stageName?.toLowerCase() ||
                s.name.toLowerCase() === session?.user?.fullName?.toLowerCase()
            ))
        );

        if (userSplits.length > 0) {
            const totalUserSplitPercentage = userSplits.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
            return (e.artistAmount * totalUserSplitPercentage) / 100;
        }

        return 0;
    };

    const totalArtist = earnings.reduce((sum, e) => sum + calculateUserShare(e), 0);
    const pendingArtist = earnings.filter(e => !e.paidToArtist).reduce((sum, e) => sum + calculateUserShare(e), 0);
    const totalSpend = earnings.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
    const totalLabel = earnings.reduce((sum, e) => sum + (e.labelAmount || 0), 0);

    const spendByRelease = Object.values(earnings.reduce((acc, e) => {
        const key = e.contract?.release?.name || 'Unknown';
        acc[key] = acc[key] || { name: key, spend: 0, revenue: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].revenue += e.labelAmount || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 4);

    const spendBySource = Object.values(earnings.reduce((acc, e) => {
        const key = (e.source || 'OTHER').toUpperCase();
        acc[key] = acc[key] || { source: key, spend: 0, streams: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].streams += e.streams || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 5);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>TOTAL BALANCE</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--status-success)' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>PENDING PAYOUTS</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>${pendingArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>AD SPEND (LABEL)</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffaa00' }}>${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>ROI (LABEL / SPEND)</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: totalSpend > 0 ? '#00ff88' : '#777' }}>
                        {totalSpend > 0 ? `${(totalLabel / totalSpend).toFixed(1)}x` : '—'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '18px', marginBottom: '24px' }}>
                <div style={{ ...glassStyle, padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>TOP RELEASES BY AD SPEND</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 4</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {spendByRelease.map((r, i) => {
                            const pct = totalSpend ? Math.round((r.spend / totalSpend) * 100) : 0;
                            return (
                                <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <div style={{ color: '#fff', fontWeight: '900' }}>{r.name}</div>
                                        <div style={{ color: '#ffaa00', fontWeight: '900' }}>${r.spend.toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '800', marginBottom: '6px' }}>Label rev: ${r.revenue.toLocaleString()} • {pct}% of spend</div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 10px #ffaa0055' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div style={{ padding: '22px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>

                <div style={{ ...glassStyle, padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>SPEND BY SOURCE</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {spendBySource.map((s, i) => {
                            const pct = totalSpend ? Math.round((s.spend / totalSpend) * 100) : 0;
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 40px', gap: '8px', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ color: '#fff', fontWeight: '900' }}>{s.source}</div>
                                    <div style={{ color: '#ffaa00', fontWeight: '900', textAlign: 'right' }}>${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '9px', color: '#777', fontWeight: '800', textAlign: 'right' }}>{pct}%</div>
                                    <div style={{ gridColumn: '1 / 4', width: '100%', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 8px #ffaa0055' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendBySource.length === 0 && (
                            <div style={{ padding: '22px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>
            </div>

            <div style={glassStyle}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '900' }}>REV_SHARE_HISTORY</h3>
                    <div style={{ fontSize: '10px', color: '#444' }}>{earnings.length} RECORDS FOUND</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, fontSize: '9px', padding: '15px 25px' }}>PERIOD</th>
                            <th style={{ ...thStyle, fontSize: '9px', padding: '15px 25px' }}>RELEASE</th>
                            <th style={{ ...thStyle, fontSize: '9px', padding: '15px 25px' }}>YOUR SHARE</th>
                            <th style={{ ...thStyle, fontSize: '9px', padding: '15px 25px' }}>STREAMS</th>
                            <th style={{ ...thStyle, fontSize: '9px', padding: '15px 25px' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {earnings.map(e => {
                            const userShare = calculateUserShare(e);
                            const userSplit = e.contract?.splits?.find(s => s.userId === session?.user?.id);

                            return (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>{e.period}</td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>
                                        <div style={{ fontWeight: '800', color: '#fff' }}>{e.contract?.release?.name}</div>
                                        <div style={{ fontSize: '9px', color: '#444', textTransform: 'uppercase' }}>{e.source}</div>
                                    </td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>
                                        <div style={{ color: 'var(--status-success)', fontWeight: '900' }}>${userShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div style={{ fontSize: '8px', color: '#444' }}>
                                            {userSplit ? `${userSplit.percentage}% OF ARTIST SHARE` : `${Math.round(e.contract?.artistShare * 100)}% SPLIT`}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>{e.streams?.toLocaleString() || '---'}</td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>
                                        <span style={{
                                            fontSize: '8px', padding: '4px 8px', borderRadius: '4px',
                                            background: e.paidToArtist ? 'var(--status-success-bg)' : 'rgba(255,255,255,0.05)',
                                            color: e.paidToArtist ? 'var(--status-success)' : '#888',
                                            fontWeight: '900'
                                        }}>
                                            {e.paidToArtist ? 'PAID' : 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {earnings.length === 0 && (
                            <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', padding: '50px', color: '#444' }}>NO EARNING DATA YET_</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                        style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', color: pagination.page <= 1 ? '#444' : '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                        PREVIOUS
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', letterSpacing: '1px' }}>
                        PAGE <span style={{ color: '#fff' }}>{pagination.page}</span> OF {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                        style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', color: pagination.page >= pagination.pages ? '#444' : '#fff', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                    >
                        NEXT
                    </button>
                </div>
            )}
        </div>
    );
}

function ArtistContractsView({ contracts, session }) {
    return (
        <div>
            <div style={{ ...glassStyle, padding: '40px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Briefcase size={20} color="var(--accent)" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: '900', color: '#fff' }}>ARTIST_AGREEMENT_PORTAL</h3>
                        <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>ACCESS YOUR SONG-LEVEL CONTRACTS AND ROYALTY SPLITS</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {contracts.map(c => {
                    const isOwner = c.userId === session?.user?.id ||
                        c.primaryArtistEmail === session?.user?.email ||
                        c.artist?.userId === session?.user?.id;

                    const userSplit = c.splits?.find(s =>
                        s.userId === session?.user?.id ||
                        (s.user?.email && s.user.email === session?.user?.email)
                    );

                    return (
                        <div key={c.id} style={{ ...glassStyle, padding: '25px', border: isOwner ? '1px solid rgba(255,255,255,0.03)' : '1px solid var(--status-success-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{c.release?.name || c.title || 'Untitled Contract'}</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <p style={{ fontSize: '9px', color: '#444' }}>CONTRACT ID: {c.id.slice(0, 8)}...</p>
                                        {!isOwner && <span style={{ fontSize: '8px', padding: '2px 4px', background: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: '3px' }}>COLLABORATOR</span>}
                                    </div>
                                </div>
                                <span style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '4px', background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: '900' }}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>{isOwner ? 'TOTAL ARTIST SHARE' : 'YOUR EFFECTIVE SHARE'}</span>
                                    <span style={{ fontSize: '14px', color: 'var(--status-success)', fontWeight: '900' }}>
                                        {isOwner
                                            ? `${Math.round(c.artistShare * 100)}%`
                                            : (() => {
                                                // Find if user has any splits either directly or via artist profile
                                                const userSplits = c.splits?.filter(s =>
                                                    s.userId === session?.user?.id ||
                                                    (s.artistId && session?.user?.artist?.id === s.artistId)
                                                ) || [];

                                                // Sum up all matching split percentages
                                                const totalUserSplitPercentage = userSplits.reduce((sum, s) => sum + parseFloat(s.percentage), 0);

                                                return `${((c.artistShare * totalUserSplitPercentage) / 100 * 100).toFixed(1)}%`;
                                            })()
                                        }
                                    </span>
                                </div>

                                {c.splits?.length > 0 && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '5px' }}>
                                        <p style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>ROYALTY_SPLITS</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {c.splits.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: s.userId === session?.user?.id ? '#fff' : '#888', fontWeight: s.userId === session?.user?.id ? '900' : '700' }}>
                                                        {s.name} {s.userId === session?.user?.id && '(YOU)'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: s.userId === session?.user?.id ? 'var(--accent)' : '#666', fontWeight: '900' }}>{s.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>LABEL SHARE</span>
                                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: '900' }}>{Math.round(c.labelShare * 100)}%</span>
                                </div>
                            </div>

                            {c.notes && (
                                <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5', fontStyle: 'italic' }}>
                                    &quot;{c.notes}&quot;
                                </div>
                            )}

                            <div style={{ marginTop: '20px', pt: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '9px', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                                <span>CREATED: {new Date(c.createdAt).toLocaleDateString()}</span>
                                {c.pdfUrl && (
                                    <a href={`/api/files/contract/${c.id}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '5px 12px', background: 'var(--accent)', color: '#000', border: 'none' }}>
                                        VIEW SIGNED PDF
                                    </a>
                                )}
                                <span>LOST_COMPLIANCE_ENFORCED</span>
                            </div>
                        </div>
                    );
                })}

                {contracts.length === 0 && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '100px', color: '#444' }}>
                        <Disc size={40} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <p style={{ fontSize: '12px', letterSpacing: '4px' }}>NO_CONTRACTS_ACTIVE</p>
                        <p style={{ fontSize: '10px', marginTop: '10px' }}>CONTACT ADMIN IF YOU BELIEVE THIS IS AN ERROR</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle = {
    padding: '20px 25px',
    fontSize: '9px',
    letterSpacing: '3px',
    color: '#444',
    fontWeight: '900',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    background: 'rgba(255,255,255,0.01)',
    textTransform: 'uppercase'
};

const tdStyle = {
    padding: '18px 25px',
    fontSize: '11px',
    color: '#888',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};
