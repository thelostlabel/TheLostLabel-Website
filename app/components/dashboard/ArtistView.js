"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Music, Disc, User as UserIcon, CheckCircle,
    XCircle, Clock, AlertCircle, Trash2, Send, ExternalLink,
    Briefcase, DollarSign, CreditCard, Users, ClipboardList,
    MessageSquare, ArrowLeft, SendHorizontal
} from 'lucide-react';
import ProjectView from './ProjectView';

const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
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
    borderRadius: '8px',
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
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (view === 'overview') fetchStats();
        else if (view === 'demos') fetchDemos();
        else if (view === 'contracts') fetchContracts();
        else if (view === 'earnings') fetchEarnings();
        else if (view === 'support') fetchRequests();
        else setLoading(false);
    }, [view]);

    useEffect(() => {
        setSelectedRequestId(searchParams.get('id'));
    }, [searchParams]);

    const [stats, setStats] = useState({ releases: 0, listeners: 0, pendingRequests: 0, earnings: 0, withdrawn: 0, balance: 0 });
    const fetchStats = async () => {
        setLoading(true);
        try {
            const [relRes, profRes, reqRes, earnRes, payRes] = await Promise.all([
                fetch('/api/artist/releases'),
                fetch('/api/profile'),
                fetch('/api/artist/requests'),
                fetch('/api/earnings'),
                fetch('/api/payments')
            ]);
            const releases = await relRes.json();
            const profile = await profRes.json();
            const requests = await reqRes.json();
            const earningsData = await earnRes.json();
            const paymentsData = await payRes.json();

            const earningsList = earningsData.earnings || [];
            const paymentsList = paymentsData.payments || [];

            const totalEarnings = earningsList.reduce((sum, e) => {
                if (!e.contract?.splits || e.contract.splits.length === 0) return sum + e.artistAmount;

                // Find if user has any splits either directly or via email/artist profile/stage name
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
                    const totalUserSplitPercentage = userSplits.reduce((sSum, s) => sSum + parseFloat(s.percentage), 0);
                    // FIX: Calculate share based on Artist Pool (artistAmount), not Gross Amount
                    const share = (e.artistAmount * totalUserSplitPercentage) / 100;
                    return sum + share;
                }

                // If splits exist but user not found -> 0 (unless they are owner and NO splits exist, which is handled at top)
                return sum;
            }, 0);

            const totalWithdrawn = paymentsList
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);

            const balance = totalEarnings - totalWithdrawn;

            setStats({
                releases: Array.isArray(releases) ? releases.length : 0,
                listeners: profile.monthlyListeners || 0,
                pendingRequests: Array.isArray(requests) ? requests.filter(r => r.status === 'pending' || r.status === 'reviewing' || r.status === 'processing' || r.status === 'needs_action').length : 0,
                earnings: totalEarnings,
                withdrawn: totalWithdrawn,
                balance: balance
            });
            setReleases(Array.isArray(releases) ? releases : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contracts');
            const data = await res.json();
            setContracts(data.contracts || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/earnings');
            const data = await res.json();
            setEarnings(data.earnings || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchDemos = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/demo?filter=mine');
            const data = await res.json();
            setDemos(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/artist/requests');
            const data = await res.json();
            setRequests(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || files.length === 0) {
            alert('Please provide a title and at least one WAV file');
            return;
        }

        setUploading(true);
        try {
            // First upload files
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            // Then create demo with file references
            const demoRes = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    genre,
                    message,
                    files: uploadData.files
                })
            });

            if (!demoRes.ok) {
                throw new Error('Failed to submit demo');
            }

            alert('Demo submitted successfully!');
            setTitle('');
            setGenre('');
            setMessage('');
            setFiles([]);
            const url = new URL(window.location);
            url.searchParams.set('view', 'demos');
            window.history.pushState({}, '', url);
            fetchDemos();
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
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
                    <AlertCircle size={32} style={{ color: '#ff4444', marginBottom: '15px' }} />
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
                <ArtistEarningsView earnings={earnings} session={session} />
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

function OverviewView({ stats, recentReleases, onNavigate, actionRequiredContract, onSignClick }) {
    const cardStyle = {
        ...glassStyle,
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '180px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={cardStyle} className="stat-card">
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                    <Users size={20} style={{ color: 'var(--accent)', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>{(stats?.listeners || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>MONTHLY_LISTENERS</div>
                    </div>
                </div>

                <div style={cardStyle} className="stat-card">
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(0,255,136,0.02) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                    <Disc size={20} style={{ color: '#00ff88', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>{stats.releases}</div>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>TOTAL_RELEASES</div>
                    </div>
                </div>

                <div style={cardStyle} className="stat-card">
                    <ClipboardList size={20} style={{ color: '#ffaa00', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>{stats.pendingRequests}</div>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>OPEN_REQUESTS</div>
                    </div>
                </div>

                <div style={cardStyle} className="stat-card">
                    <DollarSign size={20} style={{ color: '#00aaff', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>${(stats?.earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>TOTAL_EARNINGS</div>
                    </div>
                </div>

                <div style={cardStyle} className="stat-card">
                    <CreditCard size={20} style={{ color: '#ff4444', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>${(stats?.withdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>WITHDRAWN</div>
                    </div>
                </div>

                <div style={cardStyle} className="stat-card">
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                    <Briefcase size={20} style={{ color: '#00ff88', opacity: 0.5 }} />
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', color: '#00ff88' }}>${(stats?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px', marginTop: '5px' }}>CURRENT_BALANCE</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Releases */}
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
                                    <div style={{ aspectRatio: '1/1', background: '#111', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <img src={r.image} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div style={{ textAlign: 'center', padding: '80px', color: '#ff4444' }}>
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
                    <img src={release.image} alt={release.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        if (s === 'approved' || s === 'completed') return '#00ff88';
                        if (s === 'processing') return '#00aaff';
                        if (s === 'reviewing') return '#ffaa00';
                        if (s === 'rejected') return '#ff4444';
                        return '#aaa';
                    };

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isApproved ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '8px'
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                                    <span style={{ fontSize: '10px', color: '#666' }}>
                                        {req.details?.length > 60 ? req.details.substring(0, 60) + '...' : req.details || 'No details'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span style={{ fontSize: '9px', color: '#444' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                            <div style={{
                                padding: '4px 8px', borderRadius: '4px',
                                background: req.status === 'completed' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                                color: req.status === 'completed' ? '#00ff88' : '#888',
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
            case 'approved': return '#00ff88';
            case 'rejected': return '#ff4444';
            case 'reviewing': return '#ffaa00';
            default: return '#666';
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
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '4px', maxWidth: '400px' }}>
                                            <p style={{ fontSize: '9px', color: '#ff4444', fontWeight: '800', marginBottom: '4px', letterSpacing: '1px' }}>REJECTION REASON</p>
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

function SubmitView({ title, setTitle, genre, setGenre, message, setMessage, files, dragActive, handleDrag, handleDrop, handleFileSelect, removeFile, fileInputRef, uploading, handleSubmit }) {
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

    const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#666', marginBottom: '8px', fontWeight: '800' };
    const inputStyle = { width: '100%', padding: '12px 15px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', fontSize: '13px' };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
            <div style={{ ...glassStyle, padding: '40px' }}>
                <div style={{ marginBottom: '35px' }}>
                    <label style={labelStyle}>TRACK TITLE *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="ENTER TRACK TITLE"
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>GENRE</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle}>
                        <option value="">Select genre</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>MESSAGE (Optional)</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any notes about your submission..."
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>AUDIO FILES (WAV ONLY) *</label>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragActive ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                            padding: '60px 40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragActive ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>
                            {dragActive ? 'Drop files here...' : 'Drag & drop WAV files here or click to browse'}
                        </p>
                        <p style={{ color: '#444', fontSize: '10px' }}>Only .wav files are accepted</p>
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
                        <div style={{ marginTop: '15px' }}>
                            {files.map((file, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 15px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    marginBottom: '8px',
                                    borderRadius: '6px'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#888' }}>
                                        🎵 {file.name} <span style={{ color: '#444' }}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className="glow-button"
                    style={{ width: '100%', padding: '15px', opacity: uploading ? 0.5 : 1, fontWeight: '900', letterSpacing: '2px' }}
                >
                    {uploading ? 'UPLOADING...' : 'SUBMIT DEMO'}
                </button>
            </div>
        </form>
    );
}

function ProfileView({ onUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [stageName, setStageName] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');

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
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, stageName, spotifyUrl })
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

function ArtistEarningsView({ earnings, session }) {
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

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>TOTAL BALANCE</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#00ff88' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>PENDING PAYOUTS</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>${pendingArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                                        <div style={{ color: '#00ff88', fontWeight: '900' }}>${userShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div style={{ fontSize: '8px', color: '#444' }}>
                                            {userSplit ? `${userSplit.percentage}% OF ARTIST SHARE` : `${Math.round(e.contract?.artistShare * 100)}% SPLIT`}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>{e.streams?.toLocaleString() || '---'}</td>
                                    <td style={{ ...tdStyle, padding: '15px 25px' }}>
                                        <span style={{
                                            fontSize: '8px', padding: '4px 8px', borderRadius: '4px',
                                            background: e.paidToArtist ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                                            color: e.paidToArtist ? '#00ff88' : '#888',
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
                        <div key={c.id} style={{ ...glassStyle, padding: '25px', border: isOwner ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0, 255, 136, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{c.release?.name || c.title || 'Untitled Contract'}</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <p style={{ fontSize: '9px', color: '#444' }}>CONTRACT ID: {c.id.slice(0, 8)}...</p>
                                        {!isOwner && <span style={{ fontSize: '8px', padding: '2px 4px', background: 'rgba(0,255,136,0.1)', color: '#00ff88', borderRadius: '3px' }}>COLLABORATOR</span>}
                                    </div>
                                </div>
                                <span style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,255,136,0.1)', color: '#00ff88', fontWeight: '900' }}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>{isOwner ? 'TOTAL ARTIST SHARE' : 'YOUR EFFECTIVE SHARE'}</span>
                                    <span style={{ fontSize: '14px', color: '#00ff88', fontWeight: '900' }}>
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
                                    "{c.notes}"
                                </div>
                            )}

                            <div style={{ marginTop: '20px', pt: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '9px', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                                <span>CREATED: {new Date(c.createdAt).toLocaleDateString()}</span>
                                {c.pdfUrl && (
                                    <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '5px 12px', background: 'var(--accent)', color: '#000', border: 'none' }}>
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

