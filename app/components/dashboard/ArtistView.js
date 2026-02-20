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
    MessageSquare, ArrowLeft, SendHorizontal, BarChart3, TrendingUp, Shield, Bell, Lock,
    ChevronDown, ChevronRight, Filter, Download, LayoutDashboard, List
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/app/components/ToastContext';
import ProjectView from './ProjectView';
import { extractContractMetaAndNotes } from '@/lib/contract-template';

const DASHBOARD_THEME = {
    bg: '#05060B',
    surface: '#0A0D14',
    surfaceElevated: '#0F1320',
    surfaceSoft: '#151B2B',
    border: 'rgba(146,158,188,0.2)',
    borderStrong: 'rgba(116,135,255,0.42)',
    text: '#EEF3FF',
    muted: '#96A2BD',
    accent: '#7C8DFF',
    accentHover: '#B3BEFF',
    accentDark: '#4458D4',
    accentAlt: '#7756FF',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444'
};

const glassStyle = {
    background: `linear-gradient(160deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface})`,
    border: `1px solid ${DASHBOARD_THEME.border}`,
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 16px 38px rgba(2, 7, 16, 0.34)'
};

const getBaseTitle = (title) => {
    if (!title) return '';
    return title.split('(')[0]
        .split('-')[0]
        .replace(/\d{4}\s*REMASTER/gi, '')
        .replace(/SLOWED\s*\+\s*REVERB/gi, '')
        .replace(/ULTRA\s*SLOWED/gi, '')
        .replace(/SPEED\s*UP/gi, '')
        .replace(/ACOUSTIC/gi, '')
        .replace(/LIVE/gi, '')
        .replace(/REMASTERED/gi, '')
        .trim();
};

const ChartTooltip = ({ active, payload, label, color }) => {
    if (!active || !payload?.length) return null;
    const isCurrency = payload[0].payload.value !== undefined && typeof payload[0].payload.value === 'number' && !label.includes('/'); // Simple heuristic for earnings vs listeners

    return (
        <div style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '2px',
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '12px', color: '#a8b0bc', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: '900', color: p.color || color || '#fff' }}>
                    {isCurrency ? `$${Number(p.value).toLocaleString()}` : Number(p.value).toLocaleString()}
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
    const hasSignal = sanitizedData.some((point) => Number(point.value) > 0);

    if (sanitizedData.length === 0 || !hasSignal) return (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '800' }}>
            NO ACTIVITY IN SELECTED RANGE
        </div>
    );

    if (sanitizedData.length === 1) {
        const onlyPoint = sanitizedData[0];
        return (
            <div style={{
                width: '100%',
                height: `${height}px`,
                marginTop: '10px',
                borderRadius: '16px',
                border: '1px dashed rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.015)',
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
                        {Number(onlyPoint.value).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#b2bac6', fontWeight: '800', marginTop: '8px' }}>
                        {onlyPoint.label}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: `${height}px`, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={sanitizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="label"
                        hide
                    />
                    <YAxis
                        hide
                    />
                    <Tooltip content={<ChartTooltip color={color} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: '#000', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const btnStyle = {
    background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
    border: `1px solid ${DASHBOARD_THEME.border}`,
    color: DASHBOARD_THEME.text,
    padding: '10px 16px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '0.8px',
    borderRadius: '10px',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
};

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
    border: `1px solid ${DASHBOARD_THEME.border}`,
    color: DASHBOARD_THEME.text,
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    letterSpacing: '0.5px'
};

export default function ArtistView() {
    const { data: session, update } = useSession();
    const { showToast, showConfirm } = useToast();
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

    const [stats, setStats] = useState({
        releases: 0,
        listeners: 0,
        pendingRequests: 0,
        earnings: 0,
        withdrawn: 0,
        paid: 0,
        pending: 0,
        available: 0,
        balance: 0,
        trends: [],
        trendsDaily: []
    });
    const [payments, setPayments] = useState([]);

    // Withdrawal Modal State
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('BANK_TRANSFER');
    const [withdrawNotes, setWithdrawNotes] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            showToast('Please enter a valid amount', 'warning');
            return;
        }

        if (parseFloat(withdrawAmount) > (stats.available ?? stats.balance ?? 0)) {
            showToast('Amount exceeds available balance', 'error');
            return;
        }

        setWithdrawing(true);
        try {
            const res = await fetch('/api/artist/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(withdrawAmount),
                    method: withdrawMethod,
                    notes: withdrawNotes
                })
            });

            if (res.ok) {
                showToast('Withdrawal request submitted successfully', 'success');
                setWithdrawModalOpen(false);
                setWithdrawAmount('');
                setWithdrawNotes('');
                // Refresh data
                fetchStats();
                fetchPayments();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to submit request', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        } finally {
            setWithdrawing(false);
        }
    };
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
    }, []);

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

    const fetchPayments = useCallback(async () => {
        try {
            const res = await fetch('/api/payments');
            const data = await res.json();
            setPayments(data.payments || []);
        } catch (e) { console.error(e); }
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
        else if (view === 'earnings') { fetchEarnings(); fetchPayments(); }
        else if (view === 'support') fetchRequests();
        else setLoading(false);
    }, [view, fetchStats, fetchDemos, fetchContracts, fetchEarnings, fetchRequests, fetchPayments]);

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

    const navigateToView = useCallback((nextView, extraParams = {}) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', nextView);
        Object.entries(extraParams).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') params.delete(key);
            else params.set(key, String(value));
        });
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        window.dispatchEvent(new Event('popstate'));
    }, []);

    if (!loading && !hasPermission(viewToPerm[view])) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
                <div style={{ padding: '30px', ...glassStyle, textAlign: 'center', maxWidth: '400px' }}>
                    <AlertCircle size={32} style={{ color: 'var(--status-error)', marginBottom: '15px' }} />
                    <h3 style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: '900', marginBottom: '10px' }}>ACCESS_RESTRICTED</h3>
                    <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, lineHeight: '1.6' }}>
                        You do not have the required permissions to access this module. If you believe this is an error, please contact the label administration.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="artist-dashboard-view"
            style={{
                flex: 1,
                padding: '30px',
                overflowY: 'auto',
                background: DASHBOARD_THEME.bg,
                borderRadius: '0px'
            }}
        >
            <div
                style={{
                    marginBottom: '18px',
                    padding: '18px 16px',
                    borderRadius: '14px',
                    border: `1px solid ${DASHBOARD_THEME.border}`,
                    background: `linear-gradient(180deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface})`,
                    boxShadow: '0 14px 32px rgba(3, 8, 18, 0.35)'
                }}
            >
                <p style={{ margin: 0, fontSize: '11px', color: DASHBOARD_THEME.muted, letterSpacing: '1.1px', fontWeight: '900' }}>ARTIST DASHBOARD</p>
                <h2 style={{ fontSize: '22px', margin: '8px 0 0', letterSpacing: '0.8px', fontWeight: '900', color: DASHBOARD_THEME.text }}>
                    {viewTitles[view] || 'DASHBOARD'}
                </h2>
            </div>

            {!loading && view !== 'overview' && (
                <ArtistQuickAccessBar
                    stats={stats}
                    currentView={view}
                    onNavigate={navigateToView}
                />
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', fontSize: '12px', letterSpacing: '1px', color: DASHBOARD_THEME.muted }}>LOADING...</div>
            ) : view === 'overview' ? (
                <OverviewView
                    stats={stats}
                    recentReleases={releases.slice(0, 4)}
                    onNavigate={navigateToView}
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
                <ReleasesView stats={stats} />
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
                    uploadProgress={uploadProgress}
                    handleSubmit={handleSubmit}
                />
            ) : view === 'earnings' ? (
                <ArtistEarningsView
                    earnings={earnings}
                    payments={payments}
                    session={session}
                    pagination={earningsPagination}
                    onPageChange={fetchEarnings}
                    stats={stats}
                    onWithdrawClick={() => setWithdrawModalOpen(true)}
                />
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

            {/* Withdrawal Modal */}
            {
                withdrawModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                width: '450px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', marginBottom: '8px', textTransform: 'uppercase' }}>WITHDRAW_FUNDS</h3>
                            <p style={{ fontSize: '12px', color: '#555', marginBottom: '30px', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                AVAILABLE_BALANCE: <span style={{ color: 'var(--accent)' }}>${(stats.available ?? stats.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </p>

                            <form onSubmit={handleWithdrawSubmit} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '950', color: DASHBOARD_THEME.muted, letterSpacing: '1px', marginBottom: '8px' }}>AMOUNT_USD</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{ ...inputStyle, borderRadius: '2px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '950', color: DASHBOARD_THEME.muted, letterSpacing: '1px', marginBottom: '8px' }}>PAYMENT_METHOD</label>
                                    <select
                                        value={withdrawMethod}
                                        onChange={e => setWithdrawMethod(e.target.value)}
                                        style={{ ...inputStyle, borderRadius: '2px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="BANK_TRANSFER">Bank Transfer (IBAN)</option>
                                        <option value="PAYPAL">PayPal</option>
                                        <option value="CRYPTO">Crypto (USDT/BTC)</option>
                                        <option value="WISE">Wise</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '950', color: DASHBOARD_THEME.muted, letterSpacing: '1px', marginBottom: '8px' }}>PAYMENT_DETAILS / NOTES</label>
                                    <textarea
                                        value={withdrawNotes}
                                        onChange={e => setWithdrawNotes(e.target.value)}
                                        placeholder="IBAN, Email or Wallet Address..."
                                        style={{ ...inputStyle, borderRadius: '2px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={withdrawing}
                                        style={{ ...btnStyle, flex: 2, background: 'var(--accent)', color: '#000', border: 'none', height: '45px', justifyContent: 'center' }}
                                    >
                                        {withdrawing ? 'PROCESSING...' : 'SUBMIT_REQUEST'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawModalOpen(false)}
                                        style={{ ...btnStyle, flex: 1, background: 'rgba(255,255,255,0.05)', height: '45px', justifyContent: 'center' }}
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }

            {/* Signing Modal removed per user request */}
        </div >
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
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '0px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: safeColor, borderRadius: '0px', boxShadow: `0 0 10px ${safeColor}30` }}
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
                background: '#000',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: '0px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '1px',
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

function ArtistQuickAccessBar({ stats, currentView, onNavigate }) {
    const available = stats.available ?? stats.balance ?? 0;
    const pending = stats.pending ?? 0;
    const paid = stats.paid ?? 0;

    const cardStyle = {
        padding: '16px',
        background: `linear-gradient(165deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface})`,
        border: `1px solid ${DASHBOARD_THEME.border}`,
        borderRadius: '8px',
        minHeight: '92px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        cursor: 'pointer'
    };

    const labelStyle = { fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '800', letterSpacing: '0.8px', marginBottom: '8px', zIndex: 2, position: 'relative' };
    const valueStyle = { fontSize: '24px', color: DASHBOARD_THEME.text, fontWeight: '900', letterSpacing: '-0.5px', zIndex: 2, position: 'relative' };

    const navButtonStyle = {
        ...btnStyle,
        minHeight: '38px',
        borderRadius: '999px',
        width: 'auto',
        padding: '0 14px',
        fontSize: '12px',
        letterSpacing: '0.6px'
    };

    return (
        <div style={{ marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => onNavigate('earnings')}
                style={cardStyle}
            >
                <div style={{ position: 'absolute', top: '-50px', right: '-40px', width: '130px', height: '130px', background: `radial-gradient(circle, ${DASHBOARD_THEME.accent}55 0%, transparent 72%)`, pointerEvents: 'none', zIndex: 1 }} />
                <div style={labelStyle}>AVAILABLE</div>
                <div style={{ ...valueStyle, color: DASHBOARD_THEME.accentHover }}>${Number(available).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </motion.button>

            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => onNavigate('earnings')}
                style={cardStyle}
            >
                <div style={labelStyle}>PENDING</div>
                <div style={valueStyle}>${Number(pending).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </motion.button>

            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => onNavigate('earnings')}
                style={cardStyle}
            >
                <div style={labelStyle}>PAID</div>
                <div style={valueStyle}>${Number(paid).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </motion.button>

            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => onNavigate('overview')}
                style={cardStyle}
            >
                <div style={labelStyle}>MONTHLY LISTENERS</div>
                <div style={valueStyle}>{Number(stats.listeners || 0).toLocaleString()}</div>
            </motion.button>

            <div className="quick-nav-grid">
                {[
                    { view: 'submit', label: 'SUBMIT', icon: <Upload size={13} /> },
                    { view: 'contracts', label: 'CONTRACTS', icon: <Briefcase size={13} /> },
                    { view: 'support', label: 'SUPPORT', icon: <MessageSquare size={13} /> },
                    { view: 'releases', label: 'CATALOG', icon: <Disc size={13} /> }
                ].map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <motion.button
                            key={item.view}
                            whileHover={{ y: -1 }}
                            whileTap={{ y: 0 }}
                            onClick={() => onNavigate(item.view)}
                            style={{
                                ...navButtonStyle,
                                background: isActive ? DASHBOARD_THEME.accent : 'rgba(255,255,255,0.015)',
                                color: isActive ? '#0b0914' : DASHBOARD_THEME.text,
                                border: isActive ? 'none' : navButtonStyle.border
                            }}
                        >
                            {item.icon} {item.label}
                        </motion.button>
                    );
                })}
            </div>

            <style jsx>{`
                .quick-nav-grid {
                    grid-column: 1 / -1;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 2px;
                }
                @media (max-width: 860px) {
                    .quick-nav-grid {
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
}

function OverviewView({ stats, recentReleases, onNavigate, actionRequiredContract, onSignClick }) {
    const userName = stats?.user?.stageName || stats?.name || 'Artist';
    const availableCredit = stats.available ?? stats.balance ?? 0;
    const totalReleases = stats.releases || 0;
    const totalTracks = stats.songs || 0;
    const totalVideos = 0;

    const CircularProgress = ({ value, label, subtitle }) => {
        const radius = 24;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: DASHBOARD_THEME.text, marginBottom: '2px' }}>{label}</h4>
                    <p style={{ fontSize: '11px', color: DASHBOARD_THEME.accent, fontWeight: '700' }}>{subtitle}</p>
                </div>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="30" cy="30" r="24" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
                        <circle
                            cx="30"
                            cy="30"
                            r="24"
                            stroke={DASHBOARD_THEME.accent}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: '900', color: DASHBOARD_THEME.accent }}>
                        {value}%
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="beatclap-shell">
            <div className="beatclap-main-grid">
                <div className="beatclap-left-col">
                    <div className="bc-top-stats">
                        <div className="bc-stat-card">
                            <span className="bc-stat-label">Total Releases</span>
                            <span className="bc-stat-val text-accent">{totalReleases.toLocaleString()}</span>
                        </div>
                        <div className="bc-stat-card">
                            <span className="bc-stat-label">Total Tracks</span>
                            <span className="bc-stat-val text-accent">{totalTracks.toLocaleString()}</span>
                        </div>
                        <div className="bc-stat-card">
                            <span className="bc-stat-label">Total Videos</span>
                            <span className="bc-stat-val text-accent">{totalVideos.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bc-welcome-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="bc-welcome-avatar">
                                <NextImage src={stats.artistImage || '/default-album.jpg'} alt="Profile" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.62)', marginBottom: '4px' }}>
                                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>Welcome back, {userName}</h1>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: 0 }}>
                                ${availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>Credit Available</p>
                        </div>
                    </div>

                    <div className="bc-quick-actions">
                        <div className="bc-action-card" onClick={() => onNavigate('submit')}>
                            <div className="bc-action-icon"><Disc size={18} /></div>
                            <h3 className="bc-action-title">Create Release</h3>
                            <p className="bc-action-desc">Add a release to your catalog</p>
                            <ChevronRight size={16} color={DASHBOARD_THEME.accent} className="bc-action-arrow" />
                        </div>
                        <div className="bc-action-card" onClick={() => onNavigate('support')}>
                            <div className="bc-action-icon"><Users size={18} /></div>
                            <h3 className="bc-action-title">Support</h3>
                            <p className="bc-action-desc">Open a request and talk with admin</p>
                            <ChevronRight size={16} color={DASHBOARD_THEME.accent} className="bc-action-arrow" />
                        </div>
                    </div>

                    <div className="bc-recent-releases">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>Recent Releases</h3>
                            <button onClick={() => onNavigate('releases')} className="bc-btn-outline">Show All</button>
                        </div>
                        <div className="bc-releases-grid">
                            {recentReleases.length === 0 ? (
                                <p style={{ color: DASHBOARD_THEME.muted, fontSize: '12px' }}>No releases found.</p>
                            ) : (
                                recentReleases.slice(0, 4).map((release) => (
                                    <div key={release.id} className="bc-release-item" onClick={() => onNavigate('releases')}>
                                        <div className="bc-release-cover">
                                            <NextImage src={release.image || stats.artistImage || '/default-album.jpg'} alt={release.name} width={200} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div className="bc-release-name">{release.name}</div>
                                        <div className="bc-release-artist">{stats.artistName || 'Unknown Artist'}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="beatclap-right-col">
                    <div className="bc-sidebar-card">
                        <CircularProgress label="Top Retailer" subtitle="Spotify" value={38} />
                        <CircularProgress label="Top Territory" subtitle="Brazil" value={63} />

                        <div style={{ paddingTop: '16px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '800', color: DASHBOARD_THEME.text, marginBottom: '16px' }}>Listener Behaviour</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: DASHBOARD_THEME.muted }}>ACTIVE</p>
                                    <p style={{ fontSize: '16px', fontWeight: '800', color: DASHBOARD_THEME.accent }}>77%</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', color: DASHBOARD_THEME.muted, textAlign: 'right' }}>PASSIVE</p>
                                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#fff', textAlign: 'right' }}>23%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bc-sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>Total Streams</h3>
                                <p style={{ fontSize: '11px', color: DASHBOARD_THEME.muted, marginTop: '4px' }}>Last 6 months</p>
                            </div>
                            <span style={{ fontSize: '11px', color: DASHBOARD_THEME.muted, cursor: 'pointer' }}>See Trends &gt;</span>
                        </div>
                        <div style={{ flex: 1, minHeight: '180px', position: 'relative' }}>
                            <RechartsAreaChart data={stats.trends || []} color={DASHBOARD_THEME.accent} height={180} />
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', fontWeight: '800' }}>
                                <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1db954' }} /> Spotify</span>
                                <span style={{ color: DASHBOARD_THEME.muted }}>{(stats.streams || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
                                <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fa243c' }} /> Apple Music</span>
                                <span style={{ color: DASHBOARD_THEME.muted }}>{Math.floor((stats.streams || 0) * 0.45).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .beatclap-shell {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .beatclap-main-grid {
                    display: grid;
                    grid-template-columns: 2.2fr 1fr;
                    gap: 18px;
                }
                .beatclap-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .beatclap-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .text-accent {
                    color: ${DASHBOARD_THEME.accent} !important;
                }
                .bc-top-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 14px;
                }
                .bc-stat-card {
                    background: linear-gradient(160deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface});
                    border-radius: 14px;
                    border: 1px solid ${DASHBOARD_THEME.border};
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    box-shadow: 0 14px 32px rgba(3, 8, 18, 0.32);
                }
                .bc-stat-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: ${DASHBOARD_THEME.text};
                }
                .bc-stat-val {
                    font-size: 26px;
                    font-weight: 900;
                }
                .bc-welcome-banner {
                    background: linear-gradient(130deg, rgba(119,86,255,0.88) 0%, rgba(124,141,255,0.42) 130%);
                    border-radius: 16px;
                    border: 1px solid rgba(152, 139, 255, 0.35);
                    padding: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 22px 40px rgba(26, 18, 58, 0.4);
                }
                .bc-welcome-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.2);
                    border: 2px solid rgba(255,255,255,0.32);
                    overflow: hidden;
                }
                .bc-quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                }
                .bc-action-card {
                    background: linear-gradient(165deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface});
                    border-radius: 14px;
                    border: 1px solid ${DASHBOARD_THEME.border};
                    padding: 24px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .bc-action-card:hover {
                    background: linear-gradient(165deg, ${DASHBOARD_THEME.surfaceSoft}, ${DASHBOARD_THEME.surfaceElevated});
                    transform: translateY(-2px);
                    border-color: ${DASHBOARD_THEME.borderStrong};
                }
                .bc-action-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    color: ${DASHBOARD_THEME.text};
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
                }
                .bc-recent-releases {
                    margin-top: 10px;
                }
                .bc-btn-outline {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid ${DASHBOARD_THEME.border};
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                }
                .bc-releases-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 15px;
                }
                .bc-release-item {
                    cursor: pointer;
                }
                .bc-release-cover {
                    width: 100%;
                    aspect-ratio: 1/1;
                    border-radius: 10px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.05);
                    margin-bottom: 12px;
                    border: 1px solid ${DASHBOARD_THEME.border};
                }
                .bc-release-name {
                    font-size: 13px;
                    font-weight: 800;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .bc-release-artist {
                    font-size: 11px;
                    color: ${DASHBOARD_THEME.muted};
                    margin-top: 4px;
                }
                .bc-sidebar-card {
                    background: linear-gradient(165deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface});
                    border-radius: 14px;
                    border: 1px solid ${DASHBOARD_THEME.border};
                    padding: 24px;
                    box-shadow: 0 14px 32px rgba(3, 8, 18, 0.3);
                }
                @media (max-width: 1100px) {
                    .beatclap-main-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 860px) {
                    .bc-top-stats {
                        grid-template-columns: 1fr;
                    }
                    .bc-quick-actions {
                        grid-template-columns: 1fr;
                    }
                    .bc-welcome-banner {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 18px;
                    }
                }
            `}</style>
        </div>
    );
}

function ReleasesView({ stats }) {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestModal, setRequestModal] = useState(null);
    const [requestType, setRequestType] = useState('question');
    const [requestDetails, setRequestDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
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
            if (res.ok) setReleases(Array.isArray(data) ? data : []);
            else setError(data.error || 'FAILED TO LOAD');
        } catch (e) {
            console.error(e);
            setError('FAILED TO CONNECT');
        } finally {
            setLoading(false);
        }
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
                fetchReleases();
            } else {
                alert(data.error || 'Request failed');
            }
        } catch (e) {
            alert('Request failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getRequestStatus = (release) => {
        if (!release.requests || release.requests.length === 0) return null;
        const sorted = [...release.requests].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const active = sorted.find((r) => r.status !== 'rejected');
        return active || sorted[0];
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: DASHBOARD_THEME.muted }}>Loading releases...</div>;
    }

    return (
        <div>
            {requestModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div style={{ ...glassStyle, padding: '30px', width: '450px' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '10px', letterSpacing: '2px', fontWeight: '800' }}>REQUEST CHANGE</h3>
                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginBottom: '25px', letterSpacing: '0.6px' }}>
                            FOR: <strong style={{ color: '#fff' }}>{requestModal.releaseName.toUpperCase()}</strong>
                        </p>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: DASHBOARD_THEME.muted, marginBottom: '5px', fontWeight: '800' }}>REQUEST TYPE</label>
                            <select
                                value={requestType}
                                onChange={(e) => setRequestType(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: '#fff', fontSize: '13px', borderRadius: '8px' }}
                            >
                                <option value="question">Question / Help / Support</option>
                                <option value="cover_art">Update Cover Art</option>
                                <option value="audio">Update Audio File</option>
                                <option value="delete">Request Takedown (Delete)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: DASHBOARD_THEME.muted, marginBottom: '5px', fontWeight: '800' }}>DETAILS / LINKS</label>
                            <textarea
                                value={requestDetails}
                                onChange={(e) => setRequestDetails(e.target.value)}
                                placeholder="Describe your request. For files, provide a Dropbox/Drive link."
                                rows={4}
                                style={{ width: '100%', padding: '10px', background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: '#fff', resize: 'vertical', borderRadius: '8px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleRequestSubmit} disabled={submitting} style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#0B0F1A', border: 'none', justifyContent: 'center', flex: 1, padding: '12px' }}>
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
                            params.set('view', 'my-profile');
                            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                            window.dispatchEvent(new Event('popstate'));
                        }}
                        style={{ ...btnStyle, background: 'var(--accent)', color: '#0B0F1A', border: 'none', padding: '12px 30px', marginTop: '10px' }}
                    >
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
                    {(() => {
                        const groups = releases.reduce((acc, r) => {
                            const base = getBaseTitle(r.name);
                            if (!acc[base]) acc[base] = [];
                            acc[base].push(r);
                            return acc;
                        }, {});

                        const groupEntries = Object.entries(groups).sort((a, b) => {
                            const dateA = new Date(Math.max(...a[1].map((r) => new Date(r.releaseDate))));
                            const dateB = new Date(Math.max(...b[1].map((r) => new Date(r.releaseDate))));
                            return dateB - dateA;
                        });

                        const upcomingGroups = groupEntries.filter(([, groupReleases]) =>
                            groupReleases.some((r) => new Date(r.releaseDate) > new Date())
                        );

                        const pastGroups = groupEntries.filter(([, groupReleases]) =>
                            groupReleases.every((r) => new Date(r.releaseDate) <= new Date())
                        );

                        return (
                            <>
                                {upcomingGroups.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--accent)', fontWeight: '900', marginBottom: '20px', borderLeft: '3px solid var(--accent)', paddingLeft: '12px' }}>UPCOMING_DROPS</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                            {upcomingGroups.map(([baseName, groupReleases]) => (
                                                <ReleaseCard
                                                    key={baseName}
                                                    stats={stats}
                                                    release={groupReleases[0]}
                                                    versions={groupReleases}
                                                    getRequestStatus={getRequestStatus}
                                                    setRequestModal={setRequestModal}
                                                    onNavigate={(id) => {
                                                        const params = new URLSearchParams(window.location.search);
                                                        params.set('view', 'support');
                                                        params.set('id', id);
                                                        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                                                        window.dispatchEvent(new Event('popstate'));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', fontWeight: '900', marginBottom: '20px', borderLeft: '3px solid #333', paddingLeft: '12px' }}>DISCOGRAPHY</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                        {pastGroups.map(([baseName, groupReleases]) => (
                                            <ReleaseCard
                                                key={baseName}
                                                stats={stats}
                                                release={groupReleases[0]}
                                                versions={groupReleases}
                                                getRequestStatus={getRequestStatus}
                                                setRequestModal={setRequestModal}
                                                onNavigate={(id) => {
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.set('view', 'support');
                                                    params.set('id', id);
                                                    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                                                    window.dispatchEvent(new Event('popstate'));
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {pastGroups.length === 0 && (
                                        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#444', fontWeight: '800' }}>NO RELEASES FOUND IN DISCOGRAPHY</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
function ReleaseCard({ release, versions = [], stats, getRequestStatus, setRequestModal, onNavigate }) {
    const activeRequest = getRequestStatus(release);
    const baseTitle = getBaseTitle(release.name);
    const hasMultiple = versions.length > 1;

    return (
        <div style={{ ...glassStyle, padding: '15px' }}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', marginBottom: '15px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                {release.image ? (
                    <NextImage src={release.image?.startsWith('private/') ? `/api/files/release/${release.id}` : release.image} alt={release.name} width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                        <NextImage src={stats?.artistImage || '/default-album.jpg'} alt={release.name} width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                    </div>
                )}
                {hasMultiple && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#000', padding: '4px 8px', borderRadius: '2px', fontSize: '9px', fontWeight: '900', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {versions.length} VERSIONS
                    </div>
                )}
            </div>
            <h3 style={{ fontSize: '13px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{baseTitle.toUpperCase()}</h3>
            <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }}>
                {release.type?.toUpperCase()} • {new Date(release.releaseDate || release.createdAt).toLocaleDateString()}
            </p>

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
                                background: 'rgba(255,255,255,0.01)',
                                border: `1px solid ${isApproved ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '2px'
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
                            <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '800' }}>STATUS</div>
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
                    style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#071311', border: 'none' }}
                >
                    + NEW SUPPORT TICKET
                </button>
            </div>
            {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                    <p style={{ fontSize: '12px', letterSpacing: '1px', color: DASHBOARD_THEME.muted }}>NO ACTIVE SUPPORT REQUESTS</p>
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
                            background: DASHBOARD_THEME.surfaceElevated
                        }}
                        className="support-item"
                    >
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={16} color={DASHBOARD_THEME.muted} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                                    {req.release?.name || 'Support Ticket'}
                                </h4>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px' }}>
                                        {req.type.toUpperCase().replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '10px', color: DASHBOARD_THEME.muted }}>•</span>
                                    <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                                        {req.details}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span style={{ fontSize: '12px', color: DASHBOARD_THEME.muted }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                            <div style={{
                                padding: '4px 8px', borderRadius: '4px',
                                background: req.status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.08)',
                                color: req.status === 'completed' ? DASHBOARD_THEME.success : DASHBOARD_THEME.muted,
                                fontSize: '12px', fontWeight: '900'
                            }}>
                                {req.status === 'pending' ? 'OPEN' : req.status.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))
            )}
            <style jsx>{`
                .support-item:hover { background: ${DASHBOARD_THEME.surfaceSoft} !important; border-color: ${DASHBOARD_THEME.borderStrong} !important; }
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

    const labelStyle = { display: 'block', fontSize: '12px', letterSpacing: '0.8px', color: DASHBOARD_THEME.muted, marginBottom: '8px', fontWeight: '900' };
    const inputStyle = { width: '100%', padding: '14px 18px', background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' };

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
                style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#071311', border: 'none', justifyContent: 'center', height: '50px', marginTop: '10px' }}
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

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [requestId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

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

    if (loading) return <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, padding: '100px', textAlign: 'center', letterSpacing: '1px' }}>LOADING_CONVERSATION...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
                <div style={{ alignSelf: 'center', margin: '20px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: DASHBOARD_THEME.muted, letterSpacing: '1px' }}>CONVERSATION_STARTED</div>
                    <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '5px' }}>{new Date(request.createdAt).toLocaleString()}</div>
                </div>

                {/* Artist's initial description */}
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: DASHBOARD_THEME.accent, color: '#041311', padding: '15px 20px', borderRadius: '15px 15px 2px 15px', border: '1px solid rgba(0,0,0,0.1)' }}>
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
                            background: isMe ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                            padding: '15px 20px',
                            borderRadius: isMe ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                            border: `1px solid ${DASHBOARD_THEME.border}`,
                        }}>
                            {!isMe && (
                                <div style={{ fontSize: '12px', fontWeight: '900', color: isStaff ? DASHBOARD_THEME.accent : DASHBOARD_THEME.muted, marginBottom: '8px', letterSpacing: '0.8px' }}>
                                    {c.user.stageName?.toUpperCase() || 'EXTERNAL'} {isStaff ? '(STAFF)' : ''}
                                </div>
                            )}
                            <div style={{ fontSize: '12px', lineHeight: '1.6', color: isMe ? '#fff' : '#d6dbea' }}>{c.content}</div>
                            <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '10px', fontWeight: '800', textAlign: isMe ? 'right' : 'left' }}>
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', background: DASHBOARD_THEME.surface, display: 'flex', gap: '15px' }}>
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    style={{ ...inputStyle, flex: 1 }}
                />
                <button
                    disabled={sending || !newComment.trim()}
                    style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#071311', border: 'none', padding: '0 25px' }}
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
                <div style={{ textAlign: 'center', padding: '80px', color: DASHBOARD_THEME.muted }}>
                    <p style={{ fontSize: '12px', letterSpacing: '1px', marginBottom: '20px' }}>NO DEMOS SUBMITTED YET</p>
                    <a href="/dashboard?view=submit" style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#071311', border: 'none', padding: '12px 30px' }}>
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
                                    <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted }}>{demo.genre || 'No genre specified'}</p>
                                    <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '5px' }}>
                                        Submitted: {new Date(demo.createdAt).toLocaleDateString()}
                                    </p>
                                    {demo.files && demo.files.length > 0 && (
                                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '5px' }}>
                                            📁 {demo.files.length} file(s) attached
                                        </p>
                                    )}
                                    {demo.status === 'rejected' && demo.rejectionReason && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error)', borderRadius: '4px', maxWidth: '400px' }}>
                                            <p style={{ fontSize: '9px', color: 'var(--status-error)', fontWeight: '800', marginBottom: '4px', letterSpacing: '1px' }}>REJECTION REASON</p>
                                            <p style={{ fontSize: '12px', color: '#ddd', lineHeight: '1.4' }}>{demo.rejectionReason}</p>
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
                                    borderRadius: '6px'
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
    uploading, uploadProgress, handleSubmit
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

    const labelStyle = { display: 'block', fontSize: '12px', letterSpacing: '0.8px', color: DASHBOARD_THEME.muted, marginBottom: '8px', fontWeight: '950' };
    const inputStyle = { width: '100%', padding: '14px 18px', background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', transition: 'border-color 0.2s' };

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
                        style={{ ...inputStyle, resize: 'none', lineHeight: '1.45', paddingTop: '12px', paddingBottom: '12px' }}
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
                            border: `1px dashed ${dragActive ? DASHBOARD_THEME.accent : 'rgba(255,255,255,0.18)'}`,
                            padding: '60px 40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragActive ? 'rgba(124,141,255,0.1)' : DASHBOARD_THEME.surfaceSoft,
                            borderRadius: '8px',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <div style={{ marginBottom: '15px' }}>
                            <Upload size={32} style={{ color: dragActive ? DASHBOARD_THEME.accent : DASHBOARD_THEME.muted }} />
                        </div>
                        <p style={{ color: DASHBOARD_THEME.muted, fontSize: '12px', fontWeight: '600', margin: 0, lineHeight: 1.35 }}>
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
                                    background: DASHBOARD_THEME.surfaceSoft,
                                    border: `1px solid ${DASHBOARD_THEME.border}`,
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(124,141,255,0.14)', color: DASHBOARD_THEME.accent, borderRadius: '6px' }}>
                                            <Music size={14} />
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                                            {file.name} <span style={{ color: DASHBOARD_THEME.muted, marginLeft: '6px' }}>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        style={{ background: 'transparent', border: 'none', color: DASHBOARD_THEME.muted, cursor: 'pointer', padding: '5px' }}
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
                                <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '0.8px', color: DASHBOARD_THEME.accent }}>UPLOADING_TRACK...</span>
                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    style={{ height: '100%', background: 'var(--accent)', borderRadius: '2px' }}
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
                                color: '#071311',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '950',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                transition: '0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1
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
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [legalName, setLegalName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [stageName, setStageName] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Notification Preferences
    const [notifyDemos, setNotifyDemos] = useState(true);
    const [notifyEarnings, setNotifyEarnings] = useState(true);
    const [notifySupport, setNotifySupport] = useState(true);
    const [notifyContracts, setNotifyContracts] = useState(true);

    const labelStyle = { display: 'block', fontSize: '12px', letterSpacing: '0.8px', color: DASHBOARD_THEME.muted, marginBottom: '8px', fontWeight: '800' };
    const inputStyle = { width: '100%', padding: '12px 15px', background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: '#fff', fontSize: '13px', borderRadius: '8px', outline: 'none' };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            setProfile(data);
            setEmail(data.email || '');
            setFullName(data.fullName || '');
            setLegalName(data.legalName || '');
            setPhoneNumber(data.phoneNumber || '');
            setAddress(data.address || '');
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
                body: JSON.stringify({
                    email,
                    fullName,
                    legalName,
                    phoneNumber,
                    address,
                    stageName,
                    spotifyUrl,
                    notifyDemos, notifyEarnings, notifySupport, notifyContracts
                })
            });
            if (res.ok) {
                if (onUpdate) {
                    await onUpdate({
                        user: { email, fullName, legalName, phoneNumber, address, stageName, spotifyUrl }
                    });
                }
                alert('Profile updated successfully!');
            } else {
                alert('Failed to save profile');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save profile');
        } finally { setSaving(false); }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }

        setPasswordSaving(true);
        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(data.error || 'Failed to update password');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to update password');
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '80px', color: DASHBOARD_THEME.muted }}>Loading profile...</div>;
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                {/* LEFT COLUMN: Profile Details */}
                <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px', padding: '40px', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '12px', letterSpacing: '3px', fontWeight: '900', color: '#fff', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                        PROFILE_DETAILS
                    </h3>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>EMAIL ADDRESS</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>FULL NAME (LEGAL)</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="YOUR FULL NAME"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>LEGAL NAME (CONTRACT)</label>
                        <input
                            type="text"
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            placeholder="YOUR LEGAL NAME FOR CONTRACTS"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>PHONE NUMBER</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+90 5XX XXX XX XX"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>ADDRESS</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="FULL ADDRESS FOR CONTRACT DOCUMENTS"
                            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px', opacity: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>STAGE NAME</label>
                            <Lock size={10} color="var(--accent)" />
                        </div>
                        <input
                            type="text"
                            value={stageName}
                            readOnly
                            placeholder="YOUR ARTIST NAME"
                            style={{ ...inputStyle, cursor: 'not-allowed', borderColor: 'rgba(255,255,255,0.05)' }}
                        />
                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '6px', fontStyle: 'italic' }}>
                            Contact support to change your artist name.
                        </p>
                    </div>

                    <div style={{ marginBottom: '30px', opacity: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>SPOTIFY LINK</label>
                            <Lock size={10} color="var(--accent)" />
                        </div>
                        <input
                            type="url"
                            value={spotifyUrl}
                            readOnly
                            placeholder="HTTPS://OPEN.SPOTIFY.COM/ARTIST/..."
                            style={{ ...inputStyle, cursor: 'not-allowed', borderColor: 'rgba(255,255,255,0.05)' }}
                        />
                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '6px', fontStyle: 'italic' }}>
                            Contact support to update your Spotify link.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: '#071311', border: 'none', justifyContent: 'center', width: '100%', padding: '15px', opacity: saving ? 0.5 : 1, fontWeight: '900', letterSpacing: '1px' }}
                    >
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </motion.div>

                {/* RIGHT COLUMN: Password & Notifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Security Section */}
                    <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px', padding: '30px' }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '3px', fontWeight: '900', color: '#fff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={14} color="var(--accent)" /> SECURITY
                        </h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>CURRENT PASSWORD</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="••••••••"
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="••••••••"
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={labelStyle}>CONFIRM PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaving}
                            style={{
                                width: '100%', padding: '12px',
                                background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`,
                                color: '#fff', fontSize: '12px', fontWeight: '900', letterSpacing: '0.8px',
                                cursor: passwordSaving ? 'wait' : 'pointer', opacity: passwordSaving ? 0.5 : 1
                            }}
                        >
                            {passwordSaving ? 'UPDATING...' : 'UPDATE PASSWORD'}
                        </button>
                    </motion.div>

                    {/* Notifications Section */}
                    <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: '12px', padding: '30px' }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '3px', fontWeight: '900', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bell size={14} color="#fff" /> NOTIFICATIONS
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'DEMO UPDATES', state: notifyDemos, set: setNotifyDemos },
                                { label: 'NEW CONTRACTS', state: notifyContracts, set: setNotifyContracts },
                                { label: 'EARNINGS REPORTS', state: notifyEarnings, set: setNotifyEarnings },
                                { label: 'SUPPORT TICKETS', state: notifySupport, set: setNotifySupport }
                            ].map((item, i) => (
                                <div key={i}
                                    onClick={() => item.set(!item.state)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: '6px',
                                        background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: DASHBOARD_THEME.muted }}>{item.label}</span>
                                    <div style={{
                                        width: '32px', height: '18px', borderRadius: '10px',
                                        background: item.state ? 'var(--status-success)' : 'rgba(255,255,255,0.1)',
                                        position: 'relative', transition: 'background 0.2s'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: '2px', left: item.state ? '16px' : '2px',
                                            width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <p style={{ marginTop: '30px', fontSize: '12px', color: DASHBOARD_THEME.muted, textAlign: 'center', letterSpacing: '0.6px' }}>
                MEMBER SINCE: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'UNKNOWN'}
            </p>
        </div>
    );
}

function ArtistEarningsView({ earnings, payments, session, pagination, onPageChange, stats, onWithdrawClick }) {
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

    const earningsTone = {
        shellGlowA: 'rgba(107,76,246,0.11)',
        shellGlowB: 'rgba(124,141,255,0.11)',
        panel: '#101725',
        panelSoft: '#151E2F',
        panelBorder: 'rgba(174,188,214,0.16)',
        muted: '#96A6C0',
        accent: '#7C8DFF',
        info: '#60A5FA'
    };

    const panelStyle = {
        background: `linear-gradient(160deg, ${earningsTone.panelSoft}, ${earningsTone.panel})`,
        border: `1px solid ${earningsTone.panelBorder}`,
        borderRadius: '12px'
    };
    const mutedText = earningsTone.muted;

    return (
        <div style={{
            background: `radial-gradient(900px 340px at 15% -10%, ${earningsTone.shellGlowA}, transparent 50%), radial-gradient(900px 340px at 90% -20%, ${earningsTone.shellGlowB}, transparent 56%)`,
            borderRadius: '10px',
            padding: '2px'
        }}>
            {/* Wallet Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        ...panelStyle,
                        padding: '30px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: `radial-gradient(circle, ${earningsTone.accent} 0%, transparent 72%)`, opacity: 0.1, pointerEvents: 'none', zIndex: 1 }} />
                    <div style={{ fontSize: '12px', color: mutedText, fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', position: 'relative', zIndex: 2 }}>AVAILABLE BALANCE</div>
                    <div style={{ fontSize: '42px', fontWeight: '950', color: '#fff', letterSpacing: '-1.5px', marginBottom: '25px', position: 'relative', zIndex: 2 }}>
                        ${(stats?.available ?? stats?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <button
                        onClick={onWithdrawClick}
                        style={{ ...btnStyle, background: earningsTone.accent, color: '#120c22', border: 'none', padding: '12px 25px', width: '100%', justifyContent: 'center', position: 'relative', zIndex: 2 }}
                    >
                        WITHDRAW_FUNDS
                    </button>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '900', letterSpacing: '0.6px', marginBottom: '8px' }}>TOTAL EARNINGS</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>${(stats?.earnings || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div style={{ width: '100%', height: '2px', background: 'rgba(34, 197, 94, 0.35)', marginTop: '12px', borderRadius: '2px' }} />
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '900', letterSpacing: '0.6px', marginBottom: '8px' }}>PAID</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>${(stats?.paid ?? stats?.withdrawn ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div style={{ width: '100%', height: '2px', background: 'rgba(56,189,248,0.35)', marginTop: '12px', borderRadius: '2px' }} />
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '900', letterSpacing: '0.6px', marginBottom: '8px' }}>PENDING</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>${(stats?.pending || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div style={{ width: '100%', height: '2px', background: 'rgba(245, 158, 11, 0.35)', marginTop: '12px', borderRadius: '2px' }} />
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '900', letterSpacing: '0.6px', marginBottom: '8px' }}>LABEL ROI</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: totalSpend > 0 ? earningsTone.info : mutedText }}>
                            {totalSpend > 0 ? `${(totalLabel / totalSpend).toFixed(1)}x` : '—'}
                        </div>
                        <div style={{ width: '100%', height: '2px', background: totalSpend > 0 ? 'rgba(56,189,248,0.35)' : 'rgba(255, 255, 255, 0.1)', marginTop: '12px', borderRadius: '2px' }} />
                    </motion.div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: '900', margin: 0, color: mutedText }}>TOP RELEASES BY AD SPEND</h3>
                        <span style={{ fontSize: '12px', color: mutedText, fontWeight: '800' }}>Top 4</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {spendByRelease.map((r, i) => {
                            const pct = totalSpend ? Math.round((r.spend / totalSpend) * 100) : 0;
                            return (
                                <motion.div whileHover={{ scale: 1.01 }} key={i} style={{ padding: '16px', background: earningsTone.panelSoft, borderRadius: '10px', border: `1px solid ${earningsTone.panelBorder}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '13px' }}>{r.name}</div>
                                        <div style={{ color: earningsTone.info, fontWeight: '900', fontSize: '13px' }}>${r.spend.toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: mutedText, fontWeight: '800', marginBottom: '10px' }}>Label rev: ${r.revenue.toLocaleString()} • {pct}% of spend</div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: earningsTone.info, boxShadow: '0 0 10px rgba(56,189,248,0.35)' }} />
                                    </div>
                                </motion.div>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: mutedText, fontSize: '12px', letterSpacing: '1px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} style={{ ...panelStyle, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: '900', margin: 0, color: mutedText }}>SPEND BY SOURCE</h3>
                        <span style={{ fontSize: '12px', color: mutedText, fontWeight: '800' }}>Top 5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {spendBySource.map((s, i) => {
                            const pct = totalSpend ? Math.round((s.spend / totalSpend) * 100) : 0;
                            return (
                                <motion.div whileHover={{ scale: 1.02 }} key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 40px', gap: '8px', alignItems: 'center', padding: '12px 16px', background: earningsTone.panelSoft, border: `1px solid ${earningsTone.panelBorder}`, borderRadius: '10px' }}>
                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}>{s.source}</div>
                                    <div style={{ color: earningsTone.info, fontWeight: '900', textAlign: 'right', fontSize: '12px' }}>${s.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '12px', color: mutedText, fontWeight: '800', textAlign: 'right' }}>{pct}%</div>
                                    <div style={{ gridColumn: '1 / 4', width: '100%', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: earningsTone.info, boxShadow: '0 0 8px rgba(56,189,248,0.3)' }} />
                                    </div>
                                </motion.div>
                            );
                        })}
                        {spendBySource.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: mutedText, fontSize: '12px', letterSpacing: '1px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div style={{ ...glassStyle, background: panelStyle.background, border: panelStyle.border }}>
                    <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '950' }}>REV_SHARE_HISTORY</h3>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '800' }}>{earnings.length} RECORDS FOUND</div>
                    </div>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>PERIOD</th>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>RELEASE</th>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>YOUR SHARE</th>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(e => {
                                    const userShare = calculateUserShare(e);
                                    const userSplit = e.contract?.splits?.find(s => s.userId === session?.user?.id);

                                    return (
                                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ ...tdStyle, padding: '12px 25px' }}>{e.period}</td>
                                            <td style={{ ...tdStyle, padding: '12px 25px' }}>
                                                <div style={{ fontWeight: '850', color: '#fff', fontSize: '11px' }}>{e.contract?.release?.name || e.contract?.title || 'Unknown Release'}</div>
                                                <div style={{ fontSize: '12px', color: mutedText, textTransform: 'uppercase' }}>{e.source}</div>
                                            </td>
                                            <td style={{ ...tdStyle, padding: '12px 25px' }}>
                                                <div style={{ color: earningsTone.info, fontWeight: '950' }}>${userShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                <div style={{ fontSize: '12px', color: mutedText }}>
                                                    {userSplit ? `${userSplit.percentage}% SPLIT` : `OWNER`}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, padding: '12px 25px' }}>
                                                <span style={{
                                                    fontSize: '8px', padding: '3px 8px', borderRadius: '1px',
                                                    background: e.paidToArtist ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                                                    color: e.paidToArtist ? DASHBOARD_THEME.success : mutedText,
                                                    border: `1px solid ${e.paidToArtist ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                                                    fontWeight: '950'
                                                }}>
                                                    {e.paidToArtist ? 'PROCESSED' : 'UNPAID'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ ...glassStyle, background: panelStyle.background, border: panelStyle.border }}>
                    <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '950' }}>PAYOUT_LOG</h3>
                        <div style={{ fontSize: '12px', color: mutedText, fontWeight: '800' }}>{payments.length} RECORDS</div>
                    </div>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>DATE</th>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>AMOUNT</th>
                                    <th style={{ ...thStyle, fontSize: '12px', padding: '12px 25px' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ ...tdStyle, padding: '12px 25px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td style={{ ...tdStyle, padding: '12px 25px', fontWeight: '950', color: '#fff' }}>${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ ...tdStyle, padding: '12px 25px' }}>
                                            <span style={{
                                                fontSize: '8px', padding: '3px 8px', borderRadius: '1px',
                                                background: p.status === 'completed' ? 'rgba(34,197,94,0.1)' : p.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: p.status === 'completed' ? DASHBOARD_THEME.success : p.status === 'pending' ? DASHBOARD_THEME.warning : DASHBOARD_THEME.error,
                                                border: `1px solid ${p.status === 'completed' ? 'rgba(34,197,94,0.3)' : p.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                                fontWeight: '950', letterSpacing: '1px'
                                            }}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="3" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: mutedText }}>NO PAYOUT HISTORY</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {pagination && pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                        style={{ ...btnStyle, background: earningsTone.panelSoft, color: pagination.page <= 1 ? mutedText : '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                        PREVIOUS
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: mutedText, letterSpacing: '1px' }}>
                        PAGE <span style={{ color: '#fff' }}>{pagination.page}</span> OF {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                        style={{ ...btnStyle, background: earningsTone.panelSoft, color: pagination.page >= pagination.pages ? mutedText : '#fff', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                    >
                        NEXT
                    </button>
                </div>
            )}

            <div style={{ ...glassStyle, marginTop: '30px', background: panelStyle.background, border: panelStyle.border }}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '900' }}>PAYOUT_HISTORY</h3>
                    <div style={{ fontSize: '12px', color: mutedText }}>{(payments || []).length} RECORDS FOUND</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, fontSize: '12px', padding: '15px 25px' }}>DATE</th>
                            <th style={{ ...thStyle, fontSize: '12px', padding: '15px 25px' }}>METHOD</th>
                            <th style={{ ...thStyle, fontSize: '12px', padding: '15px 25px' }}>REFERENCE</th>
                            <th style={{ ...thStyle, fontSize: '12px', padding: '15px 25px' }}>STATUS</th>
                            <th style={{ ...thStyle, fontSize: '12px', padding: '15px 25px', textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(payments || []).length > 0 ? (payments || []).map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ ...tdStyle, padding: '15px 25px' }}>{new Date(p.createdAt || p.processedAt).toLocaleDateString()}</td>
                                <td style={{ ...tdStyle, padding: '15px 25px', textTransform: 'uppercase' }}>{p.method || 'Bank Transfer'}</td>
                                <td style={{ ...tdStyle, padding: '15px 25px', fontFamily: 'monospace', color: mutedText }}>{p.reference || '---'}</td>
                                <td style={{ ...tdStyle, padding: '15px 25px' }}>
                                    <span style={{
                                        fontSize: '8px', padding: '4px 8px', borderRadius: '4px',
                                        background: p.status === 'completed' ? 'rgba(34,197,94,0.1)' : p.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: p.status === 'completed' ? DASHBOARD_THEME.success : p.status === 'pending' ? DASHBOARD_THEME.warning : DASHBOARD_THEME.error,
                                        fontWeight: '900', textTransform: 'uppercase'
                                    }}>
                                        {p.status}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, padding: '15px 25px', textAlign: 'right', fontWeight: '900', color: '#fff' }}>
                                    ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', padding: '30px', color: mutedText }}>NO PAYOUT DATA YET_</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ArtistContractsView({ contracts, session }) {
    return (
        <div>
            <div style={{ ...glassStyle, padding: '32px', marginBottom: '24px', borderRadius: '10px', border: `1px solid ${DASHBOARD_THEME.border}` }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: DASHBOARD_THEME.surfaceSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${DASHBOARD_THEME.border}` }}>
                        <Briefcase size={20} color="var(--accent)" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', textTransform: 'uppercase' }}>ARTIST_AGREEMENT_PORTAL</h3>
                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, marginTop: '4px', fontWeight: '800', letterSpacing: '0.8px' }}>MANAGE_SONG_LEVEL_CONTRACTS_AND_ROYALTY_SPLITS</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {contracts.map(c => {
                    const { userNotes } = extractContractMetaAndNotes(c.notes || '');
                    const isOwner = c.userId === session?.user?.id ||
                        c.primaryArtistEmail === session?.user?.email ||
                        c.artist?.userId === session?.user?.id;

                    const userSplit = c.splits?.find(s =>
                        s.userId === session?.user?.id ||
                        (s.user?.email && s.user.email === session?.user?.email)
                    );

                    return (
                        <div key={c.id} style={{ ...glassStyle, padding: '24px', borderRadius: '10px', border: isOwner ? `1px solid ${DASHBOARD_THEME.border}` : '1px solid rgba(34,197,94,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '950', color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px' }}>{c.release?.name || c.title || 'Untitled Contract'}</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '900', letterSpacing: '0.8px' }}>REF_ID: {c.id.slice(0, 8).toUpperCase()}</p>
                                        {!isOwner && <span style={{ fontSize: '7px', padding: '2px 6px', background: 'rgba(57, 255, 20, 0.05)', color: 'var(--accent)', borderRadius: '1px', fontWeight: '950', border: '1px solid rgba(57, 255, 20, 0.1)' }}>COLLABORATOR</span>}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '8px', padding: '4px 8px', borderRadius: '1px',
                                    background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                                    color: c.status === 'active' ? DASHBOARD_THEME.success : DASHBOARD_THEME.muted,
                                    border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.1)'}`,
                                    fontWeight: '950', letterSpacing: '1px'
                                }}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '950', letterSpacing: '0.8px' }}>{isOwner ? 'TOTAL_ARTIST_SHARE' : 'YOUR_EFFECTIVE_SHARE'}</span>
                                    <span style={{ fontSize: '15px', color: 'var(--accent)', fontWeight: '950' }}>
                                        {isOwner
                                            ? `${Math.round(c.artistShare * 100)}%`
                                            : (() => {
                                                const userSplits = c.splits?.filter(s =>
                                                    s.userId === session?.user?.id ||
                                                    (s.artistId && session?.user?.artist?.id === s.artistId)
                                                ) || [];
                                                const totalUserSplitPercentage = userSplits.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
                                                return `${((c.artistShare * totalUserSplitPercentage) / 100 * 100).toFixed(1)}%`;
                                            })()
                                        }
                                    </span>
                                </div>

                                {c.splits?.length > 0 && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '15px', marginTop: '5px' }}>
                                        <p style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '950', letterSpacing: '1px', marginBottom: '12px' }}>ROYALTY_SPLITS</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {c.splits.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: s.userId === session?.user?.id ? '#fff' : DASHBOARD_THEME.muted, fontWeight: '950' }}>
                                                        {s.name.toUpperCase()} {s.userId === session?.user?.id && '(YOU)'}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: s.userId === session?.user?.id ? 'var(--accent)' : DASHBOARD_THEME.muted, fontWeight: '950' }}>{s.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '15px' }}>
                                    <span style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, fontWeight: '950', letterSpacing: '0.8px' }}>LABEL_SHARE</span>
                                    <span style={{ fontSize: '15px', color: '#fff', fontWeight: '950' }}>{Math.round(c.labelShare * 100)}%</span>
                                </div>
                            </div>

                            {userNotes && (
                                <div style={{ fontSize: '12px', color: DASHBOARD_THEME.muted, lineHeight: '1.5', fontStyle: 'italic' }}>
                                    &quot;{userNotes}&quot;
                                </div>
                            )}

                            <div style={{ marginTop: '20px', pt: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '12px', color: DASHBOARD_THEME.muted, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '950', letterSpacing: '0.8px' }}>
                                <span>SINCE: {new Date(c.createdAt).toLocaleDateString()}</span>
                                {c.pdfUrl && (
                                    <a href={`/api/files/contract/${c.id}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '8px 15px', background: DASHBOARD_THEME.accent, color: '#071311', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '950' }}>
                                        VIEW_AGREEMENT
                                    </a>
                                )}
                                <span>LOST_COMPLIANCE_ACTIVE</span>
                            </div>
                        </div>
                    );
                })}

                {contracts.length === 0 && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '100px', color: DASHBOARD_THEME.muted }}>
                        <Disc size={40} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <p style={{ fontSize: '12px', letterSpacing: '4px' }}>NO_CONTRACTS_ACTIVE</p>
                        <p style={{ fontSize: '12px', marginTop: '10px' }}>CONTACT ADMIN IF YOU BELIEVE THIS IS AN ERROR</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle = {
    padding: '20px 25px',
    fontSize: '12px',
    letterSpacing: '1px',
    color: DASHBOARD_THEME.muted,
    fontWeight: '900',
    borderBottom: `1px solid ${DASHBOARD_THEME.border}`,
    background: DASHBOARD_THEME.surface,
    textTransform: 'uppercase'
};

const tdStyle = {
    padding: '18px 25px',
    fontSize: '12px',
    color: DASHBOARD_THEME.muted,
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};
