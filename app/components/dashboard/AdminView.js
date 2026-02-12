"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { Users, Mic2, Disc, FileAudio, AlertCircle, RefreshCw, Trash2, Edit3, CheckCircle, XCircle, Briefcase, DollarSign, CreditCard, Plus, HelpCircle, MessageSquare, ArrowLeft, SendHorizontal, Edit, Edit2, Download, Search, Music, BarChart3, TrendingUp, Target, FileText } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminView() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const { showToast, showConfirm } = useToast();
    const view = searchParams.get('view') || 'overview';

    const [submissions, setSubmissions] = useState([]);
    const [artists, setArtists] = useState([]);
    const [unlistedUsers, setUnlistedUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [siteContent, setSiteContent] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (view === 'submissions') fetchSubmissions();
        else if (view === 'artists') { fetchArtists(); fetchUsers(); }
        else if (view === 'users') fetchUsers();
        else if (view === 'requests') fetchRequests();
        else if (view === 'content') fetchContent();
        else if (view === 'contracts') { fetchContracts(); fetchArtists(); fetchReleases(); fetchSubmissions(); }
        else if (view === 'releases') fetchReleases();
        else if (view === 'earnings') { fetchEarnings(); fetchContracts(); }
        else if (view === 'payments') { fetchPayments(); fetchUsers(); }
        else if (view === 'webhooks') fetchWebhooks();
        else if (view === 'communications') fetchArtists();
        else if (view === 'settings') setLoading(false);
        else setLoading(false);
    }, [view]);

    // ... (rest of imports/fetches)

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/content');
            const data = await res.json();
            setSiteContent(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/demo');
            const data = await res.json();
            setSubmissions(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchArtists = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/artists');
            const data = await res.json();
            setArtists(data.artists || []);
            setUnlistedUsers(data.unlistedUsers || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchWebhooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/webhooks');
            const data = await res.json();
            setWebhooks(Array.isArray(data) ? data : []);
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

    const [earningsPagination, setEarningsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });

    const fetchEarnings = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/earnings?page=${page}&limit=50`);
            const data = await res.json();
            setEarnings(data.earnings || []);
            if (data.pagination) {
                setEarningsPagination(data.pagination);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payments');
            const data = await res.json();
            setPayments(data.payments || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchReleases = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/releases');
            const data = await res.json();
            setReleases(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    const handleSyncStats = async (userId, existingUrl, artistId = null) => {
        if (!userId && !existingUrl) return; // Silent return if called without arguments (e.g. from a refresh link)

        let spotifyUrl = existingUrl;
        if (!spotifyUrl) {
            spotifyUrl = prompt("Enter Artist Spotify Profile URL:");
            if (!spotifyUrl) return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, artistId, spotifyUrl })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`SYNC_COMPLETED: ${data.monthlyListeners?.toLocaleString()} Listeners`, "success");
                fetchArtists();
                if (view === 'users') fetchUsers();
            } else {
                showToast(data.error || "Sync failed", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Sync error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, reason = null) => {
        try {
            await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason: reason })
            });
            fetchSubmissions();
        } catch (e) { console.error(e); }
    };

    const handleRequestStatusUpdate = async (id, status, adminNote = null, assignedToId = null) => {
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, adminNote, assignedToId })
            });

            if (res.ok) {
                const updated = await res.json();
                setRequests(prev => prev.map(r => r.id === id ? updated : r));
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteDemo = async (id) => {
        showConfirm(
            "DELETE SUBMISSION?",
            "Are you sure you want to PERMANENTLY delete this submission? This action cannot be undone.",
            async () => {
                try {
                    await fetch(`/api/demo/${id}`, { method: 'DELETE' });
                    showToast("Submission deleted", "success");
                    fetchSubmissions();
                } catch (e) {
                    showToast("Delete failed", "error");
                }
            }
        );
    };

    const handleTestWebhook = async () => {
        try {
            const res = await fetch('/api/webhook/test', { method: 'POST' });
            const data = await res.json();
            showToast(data.success ? "Webhook sent!" : "Webhook failed", data.success ? "success" : "error");
        } catch (e) { showToast("Error testing webhook", "error"); }
    };

    const perms = session?.user?.permissions || {};
    const isAdmin = session?.user?.role === 'admin';
    const isAR = session?.user?.role === 'a&r';

    const hasAdminPermission = (p) => {
        if (isAdmin) return true; // Super admin
        return perms[p] === true;
    };

    const viewToPerm = {
        overview: 'admin_view_overview',
        submissions: 'admin_view_submissions',
        artists: 'admin_view_artists',
        users: 'admin_view_users',
        requests: 'admin_view_requests',
        content: 'admin_view_content',
        webhooks: 'admin_view_webhooks',
        contracts: 'admin_view_contracts',
        earnings: 'admin_view_earnings',
        payments: 'admin_view_payments',
        releases: 'admin_view_releases',
        settings: 'admin_view_settings',
        communications: 'admin_view_communications'
    };

    if (!loading && !hasAdminPermission(viewToPerm[view])) {
        // ... (existing components)
    }

    return (
        <div style={{ padding: '0px' }}>
            {/* ... (existing components) */}

            {view === 'overview' && <HomeView />}
            {view === 'submissions' && <SubmissionsView demos={submissions} onUpdateStatus={handleStatusUpdate} />}
            {view === 'artists' && <ArtistsView artists={artists} users={users} unlistedUsers={unlistedUsers} onSync={handleSyncStats} onRefresh={fetchArtists} />}
            {view === 'users' && <UsersView users={users} onRoleChange={handleRoleChange} onRefresh={fetchUsers} />}
            {view === 'requests' && <RequestsView requests={requests} onUpdateStatus={handleRequestStatusUpdate} />}
            {view === 'contracts' && <ContractsView contracts={contracts} artists={artists} releases={releases} demos={submissions.filter(s => s.status === 'approved')} onRefresh={fetchContracts} />}
            {view === 'earnings' && <EarningsView earnings={earnings} contracts={contracts} onRefresh={fetchEarnings} pagination={earningsPagination} onPageChange={fetchEarnings} />}
            {view === 'payments' && <PaymentsView payments={payments} users={users} onRefresh={fetchPayments} />}
            {view === 'content' && <ContentView content={siteContent} onRefresh={fetchContent} />}
            {view === 'webhooks' && <WebhooksView webhooks={webhooks} onRefresh={fetchWebhooks} />}
            {view === 'releases' && <ReleasesView releases={releases} />}
            {view === 'communications' && <CommunicationsView artists={artists} />}
            {view === 'settings' && <SettingsView />}

        </div>
    );
}

// ============ VIEWS ============

const glassStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(26px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
};

const statCardStyle = {
    ...glassStyle,
    padding: '28px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
};

const thStyle = {
    padding: '20px 25px',
    fontSize: '9px',
    letterSpacing: '3px',
    color: '#444',
    fontWeight: '900',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    textTransform: 'uppercase'
};

const tdStyle = {
    padding: '18px 25px',
    fontSize: '11px',
    color: '#888',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};

const btnStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#666',
    padding: '8px 16px',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
};

const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '12px',
    fontSize: '11px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};

function SubmissionsView({ demos, onStatusUpdate, onDelete }) {
    const { showToast, showConfirm } = useToast();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'reviewing', 'approved', 'rejected'
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--status-success)';
            case 'rejected': return 'var(--status-error)';
            case 'reviewing': return 'var(--status-warning)';
            default: return 'var(--status-neutral)';
        }
    };

    const filteredDemos = demos.filter(demo => {
        const matchesTab = demo.status === activeTab;
        const matchesSearch = demo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            demo.artist?.stageName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {['pending', 'reviewing', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === tab ? '#fff' : '#444',
                                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                paddingBottom: '5px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
            </div>

            <div style={glassStyle}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-hover)' }}>
                                <th style={thStyle}>DATE</th>
                                <th style={thStyle}>ARTIST</th>
                                <th style={thStyle}>TRACK / GENRE</th>
                                <th style={thStyle}>STATUS</th>
                                <th style={thStyle}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDemos.map(demo => (
                                <tr key={demo.id} style={{ borderBottom: '1px solid #1a1a1b' }}>
                                    <td style={tdStyle}>{new Date(demo.createdAt).toLocaleDateString()}</td>
                                    <td style={tdStyle}>
                                        <strong>{demo.artist?.stageName || demo.artist?.email || 'Unknown'}</strong>
                                    </td>
                                    <td style={tdStyle}>
                                        <div>{demo.title}</div>
                                        <div style={{ fontSize: '10px', color: '#555' }}>{demo.genre}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: getStatusColor(demo.status) }}>
                                            {demo.status.toUpperCase()}
                                        </span>
                                        {demo.reviewedBy && (
                                            <div style={{ fontSize: '8px', color: '#444', marginTop: '2px' }}>BY {demo.reviewedBy.split('@')[0]}</div>
                                        )}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link
                                                href={`/dashboard/demo/${demo.id}`}
                                                style={{ ...btnStyle, color: '#fff', border: '1px solid var(--border)', background: 'var(--surface-hover)', textDecoration: 'none' }}
                                            >
                                                REVIEW
                                            </Link>
                                            <button onClick={() => onDelete(demo.id)} style={{ ...btnStyle, color: '#444' }}>DELETE</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDemos.length === 0 && (
                                <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO {activeTab.toUpperCase()} SUBMISSIONS</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


function UserLinker({ artistId, users, artistEmail }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [linking, setLinking] = useState(false);

    // Auto-suggest based on email match
    const suggestedUser = artistEmail ? users.find(u => u.email.toLowerCase() === artistEmail.toLowerCase()) : null;

    const filteredUsers = users?.filter(u =>
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.stageName?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 5) || [];

    const handleLink = async (userToLink) => {
        const user = userToLink || selectedUser;
        if (!user) return;
        setLinking(true);
        try {
            const res = await fetch('/api/admin/artists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: artistId, userId: user.id })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                showToast('Failed to link user', "error");
            }
        } catch (e) { console.error(e); showToast('Error linking user', "error"); }
        finally { setLinking(false); }
    };

    return (
        <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#666', marginBottom: '10px' }}>LINK EXISTING USER ACCOUNT</div>

            {suggestedUser && !selectedUser && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 197, 66, 0.18)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '2px' }}>SUGGESTED MATCH</div>
                            <div style={{ fontSize: '11px', color: '#fff' }}>{suggestedUser.email}</div>
                        </div>
                        <button
                            onClick={() => handleLink(suggestedUser)}
                            disabled={linking}
                            style={{ ...btnStyle, background: 'var(--accent)', color: '#000', fontSize: '9px', padding: '5px 10px' }}
                        >
                            {linking ? 'LINKING...' : 'LINK NOW'}
                        </button>
                    </div>
                </div>
            )}

            {!selectedUser ? (
                <>
                    <input
                        placeholder="Search other user email or name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {searchTerm && filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={() => setSelectedUser(u)}
                                style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', cursor: 'pointer', fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>{u.stageName || 'No Stage Name'} <span style={{ color: '#666' }}>({u.email})</span></span>
                                <span style={{ color: 'var(--accent)', fontSize: '9px', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '16px' }}>SELECT</span>
                            </div>
                        ))}
                        {searchTerm && filteredUsers.length === 0 && (
                            <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', padding: '5px' }}>No users found matching search</div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                        Link <strong>{selectedUser.email}</strong>?
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleLink()} disabled={linking} style={{ ...btnStyle, flex: 1, background: 'var(--accent)', color: '#000', justifyContent: 'center' }}>
                            {linking ? 'LINKING...' : 'CONFIRM LINK'}
                        </button>
                        <button onClick={() => setSelectedUser(null)} style={{ ...btnStyle, flex: 1, justifyContent: 'center' }}>CANCEL</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArtistsView({ artists, users, onSync, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const canManage = session?.user?.role === 'admin' || session?.user?.permissions?.canManageArtists;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newArtist, setNewArtist] = useState({ name: '', spotifyUrl: '', email: '' });
    const [saving, setSaving] = useState(false);

    // Fix: Prevent spam clicking
    const [syncingArtistId, setSyncingArtistId] = useState(null);
    const [isSyncingAll, setIsSyncingAll] = useState(false);

    // Filter artists based on search
    const filteredArtists = artists.filter(artist =>
        artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newArtist.name) return showToast('Name Required', "warning");
        setSaving(true);
        try {
            const res = await fetch('/api/admin/artists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArtist)
            });
            if (res.ok) {
                setIsCreating(false);
                setNewArtist({ name: '', spotifyUrl: '', email: '' });
                showToast("Artist profile created", "success");
                window.location.reload();
            } else {
                const err = await res.json();
                showToast(err.error || "Creation failed", "error");
            }
        } catch (e) { showToast("Create error", "error"); }
        finally { setSaving(false); }
    };

    if (selectedArtist) {
        // ... (Detail view logic remains similar, maybe simplified)
        return (
            <div style={{ ...glassStyle, padding: '30px' }}>
                <button onClick={() => setSelectedArtist(null)} style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>← BACK</button>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedArtist.image ? <NextImage src={selectedArtist.image} alt={selectedArtist.name} width={80} height={80} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>👤</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedArtist.name}</h2>
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>{selectedArtist.email || 'No Email Linked'}</div>
                        {selectedArtist.spotifyUrl && <a href={selectedArtist.spotifyUrl} target="_blank" style={{ color: 'var(--accent)', fontSize: '11px', textDecoration: 'none', display: 'block', marginTop: '5px' }}>OPEN SPOTIFY ↗</a>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '5px' }}>MONTHLY LISTENERS</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: (selectedArtist.monthlyListeners !== undefined && selectedArtist.monthlyListeners !== null) ? 'var(--accent)' : 'var(--status-error)' }}>
                            {(selectedArtist.monthlyListeners !== undefined && selectedArtist.monthlyListeners !== null) ? selectedArtist.monthlyListeners.toLocaleString() : (
                                <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <AlertCircle size={14} /> SYNC NEEDED
                                </span>
                            )}
                        </div>
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (syncingArtistId) return;
                                setSyncingArtistId(selectedArtist.id);
                                await onSync(selectedArtist.userId, selectedArtist.spotifyUrl, selectedArtist.id);
                                setSyncingArtistId(null);
                            }}
                            disabled={syncingArtistId === selectedArtist.id}
                            className="glow-button"
                            style={{
                                padding: '8px 20px',
                                fontSize: '11px',
                                marginTop: '10px',
                                opacity: syncingArtistId === selectedArtist.id ? 0.7 : 1,
                                cursor: syncingArtistId === selectedArtist.id ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <RefreshCw size={12} style={{ marginRight: '5px', animation: syncingArtistId === selectedArtist.id ? 'spin 1s linear infinite' : 'none' }} />
                            {syncingArtistId === selectedArtist.id ? 'SYNCING...' : 'SYNC SPOTIFY'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '11px', color: '#666', fontWeight: '800', marginBottom: '15px' }}>LINKED USER ACCOUNT</h3>
                        {selectedArtist.user ? (
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedArtist.user.stageName || selectedArtist.user.fullName}</div>
                                <div style={{ fontSize: '12px', color: '#555' }}>{selectedArtist.user.email}</div>
                                <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--accent)' }}>✓ ACCOUNT LINKED</div>
                                <button
                                    onClick={() => {
                                        showConfirm(
                                            "UNLINK ACCOUNT?",
                                            "Are you sure you want to unlink this user from the artist profile? They will lose access to their stats and dashboard.",
                                            async () => {
                                                try {
                                                    const res = await fetch('/api/admin/artists', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: selectedArtist.id, userId: null })
                                                    });
                                                    if (res.ok) {
                                                        showToast("Account unlinked successfully", "success");
                                                        window.location.reload();
                                                    } else {
                                                        showToast("Failed to unlink account", "error");
                                                    }
                                                } catch (e) { showToast('Error unlinking account', "error"); }
                                            }
                                        );
                                    }}
                                    style={{ ...btnStyle, marginTop: '15px', color: 'var(--status-error)', borderColor: '#ff444430', width: '100%', justifyContent: 'center' }}
                                >
                                    UNLINK ACCOUNT
                                </button>
                            </div>
                        ) : (
                            <UserLinker artistId={selectedArtist.id} users={users} artistEmail={selectedArtist.email} />
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search artists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '100%', maxWidth: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
                {canManage && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={async () => {
                                if (isSyncingAll) return;
                                if (!confirm("Start bulk background sync? This will process up to 10 artists needing update.")) return;
                                setIsSyncingAll(true);
                                try {
                                    const res = await fetch('/api/admin/scrape/refresh', { method: 'POST' });
                                    const data = await res.json();
                                    showToast(`Synced ${data.count} artists.`, "success");
                                    if (onRefresh) onRefresh();
                                } catch (e) { showToast("Sync failed", "error"); }
                                finally { setIsSyncingAll(false); }
                            }}
                            disabled={isSyncingAll}
                            style={{
                                ...btnStyle,
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isSyncingAll ? 0.7 : 1,
                                cursor: isSyncingAll ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <RefreshCw size={14} style={{ animation: isSyncingAll ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncingAll ? 'SYNCING...' : 'SYNC ALL'}
                        </button>
                        <button onClick={() => setIsCreating(true)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={14} /> NEW ARTIST
                        </button>
                    </div>
                )}
            </div>

            {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '450px',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                            <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                            <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>NEW_ARTIST_PROFILE</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>ARTIST_NAME *</label>
                                <input
                                    placeholder="e.g. Lost Boy"
                                    value={newArtist.name}
                                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>EMAIL_ADDRESS</label>
                                <input
                                    placeholder="contact@artist.com"
                                    value={newArtist.email}
                                    onChange={(e) => setNewArtist({ ...newArtist, email: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>SPOTIFY_URL</label>
                                <input
                                    placeholder="https://open.spotify.com/artist/..."
                                    value={newArtist.spotifyUrl}
                                    onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                className="glow-button"
                                style={{ flex: 2, padding: '15px', justifyContent: 'center', height: 'auto' }}
                            >
                                {saving ? 'INITIALIZING...' : 'CREATE_PROFILE'}
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    borderRadius: '16px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div style={{
                ...glassStyle,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>ARTIST</th>
                            <th style={thStyle}>MONTHLY</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>LINKED USER</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArtists.map(artist => (
                            <tr key={artist.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setSelectedArtist(artist)}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{artist.name}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)' }}>
                                        {(artist.monthlyListeners !== null && artist.monthlyListeners !== undefined) ? artist.monthlyListeners.toLocaleString() : '---'}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{artist.lastSyncedAt ? new Date(artist.lastSyncedAt).toLocaleDateString() : 'NEVER'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(245, 197, 66, 0.1)', padding: '2px 8px', borderRadius: '16px', border: '1px solid rgba(245, 197, 66, 0.1)' }}>ACTIVE</span>
                                </td>
                                <td style={tdStyle}>
                                    {artist.user ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '10px' }}>{artist.user.email}</span>
                                            <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>Verified account linked.</p>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#444', fontSize: '10px' }}>UNLINKED</span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSync(artist.userId, artist.spotifyUrl, artist.id);
                                            }}
                                            style={{ ...btnStyle, fontSize: '10px', padding: '5px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}
                                        >
                                            <RefreshCw size={10} />
                                        </button>
                                        <button style={{ ...btnStyle, fontSize: '10px', padding: '5px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>MANAGE</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReleasesView({ releases }) {
    const [activeTab, setActiveTab] = useState('all'); // 'upcoming', 'all', 'released'
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRelease, setEditingRelease] = useState(null);
    const [saving, setSaving] = useState(false);
    const [expandedReleaseId, setExpandedReleaseId] = useState(null);
    const { showToast, showConfirm } = useToast();

    const handleDelete = (id) => {
        showConfirm(
            "DELETE RELEASE?",
            "Are you sure? This will delete the release definition. It might NOT delete the tracks from the database depending on configuration.",
            async () => {
                try {
                    const res = await fetch(`/api/releases/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Release deleted", "success");
                        window.location.reload();
                    } else {
                        showToast("Failed to delete", "error");
                    }
                } catch (e) { showToast("Error deleting", "error"); }
            }
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/releases/${editingRelease.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingRelease)
            });
            if (res.ok) {
                showToast("Release updated", "success");
                setEditingRelease(null);
                window.location.reload();
            } else {
                showToast("Failed to update", "error");
            }
        } catch (e) { showToast("Error updating", "error"); }
        finally { setSaving(false); }
    };

    const filteredReleases = releases.filter(r => {
        const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.artistName?.toLowerCase().includes(searchTerm.toLowerCase());

        const releaseDate = new Date(r.releaseDate);
        const now = new Date();

        if (activeTab === 'upcoming') {
            return matchesSearch && releaseDate > now;
        } else if (activeTab === 'released') {
            return matchesSearch && releaseDate <= now;
        }
        return matchesSearch;
    }).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    const getBaseTitle = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/\s*-\s*(slowed|super slowed|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version)\s*$/i, '')
            .replace(/\s*\((slowed|super slowed|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version)\)\s*$/i, '')
            .trim();
    };

    // Group releases logic
    const groupedReleases = useMemo(() => {
        const groups = {};
        filteredReleases.forEach(release => {
            const base = getBaseTitle(release.name);
            if (!groups[base]) groups[base] = [];
            groups[base].push(release);
        });
        return groups;
    }, [filteredReleases]);

    // Sort groups by latest release date
    const sortedGroups = Object.values(groupedReleases).sort((groupA, groupB) => {
        const latestA = groupA.reduce((max, r) => new Date(r.releaseDate) > new Date(max.releaseDate) ? r : max, groupA[0]);
        const latestB = groupB.reduce((max, r) => new Date(r.releaseDate) > new Date(max.releaseDate) ? r : max, groupB[0]);
        return new Date(latestB.releaseDate) - new Date(latestA.releaseDate);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {['all', 'upcoming', 'released'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: activeTab === tab ? '#fff' : '#666',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                boxShadow: activeTab === tab ? '0 2px 10px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search by title or artist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            ...inputStyle,
                            width: '300px',
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {sortedGroups.map(group => {
                    // Use the "Main" release (e.g. Original Mix, or just the first one) as the preview
                    const mainRelease = group.find(r => r.name.toLowerCase() === getBaseTitle(r.name).toLowerCase()) || group[0];
                    const isExpanded = expandedReleaseId === getBaseTitle(mainRelease.name);
                    const variants = group.filter(r => r.id !== mainRelease.id);
                    const isReleased = new Date(mainRelease.releaseDate) <= new Date();

                    return (
                        <div key={mainRelease.id} className="glass" style={{ padding: '0', display: 'flex', flexDirection: 'column', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.2s', position: 'relative' }}>
                            {/* Main Card */}
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--surface-hover)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {mainRelease.image ? (
                                        <NextImage src={mainRelease.image?.startsWith('private/') ? `/api/files/release/${mainRelease.id}` : (mainRelease.image || '/default-album.jpg')} alt={mainRelease.name} width={240} height={240} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Disc size={40} color="#222" />
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        padding: '4px 8px', borderRadius: '8px',
                                        background: isReleased ? 'rgba(0,0,0,0.6)' : 'rgba(255,170,0,0.8)',
                                        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', fontSize: '9px', fontWeight: '900', letterSpacing: '1px'
                                    }}>
                                        {isReleased ? 'RELEASED' : 'UPCOMING'}
                                    </div>
                                    {/* Action Buttons Overlay on Image */}
                                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingRelease(mainRelease); }}
                                            style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '9px', fontWeight: '900', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            <Edit3 size={10} /> EDIT
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(mainRelease.id); }}
                                            style={{ flex: 1, padding: '8px', background: 'rgba(255,68,68,0.2)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '9px', fontWeight: '900', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            <Trash2 size={10} /> DELETE
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {getBaseTitle(mainRelease.name)}
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800', marginBottom: '4px' }}>
                                        {mainRelease.artistName || 'Unknown Artist'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>
                                            {new Date(mainRelease.releaseDate || mainRelease.createdAt).toLocaleDateString()}
                                        </p>
                                        {variants.length > 0 && (
                                            <button
                                                onClick={() => setExpandedReleaseId(isExpanded ? null : getBaseTitle(mainRelease.name))}
                                                style={{ background: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                {isExpanded ? 'HIDE' : `+${variants.length} VERSIONS`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Variants List */}
                            <AnimatePresence>
                                {isExpanded && variants.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
                                    >
                                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {variants.map(v => (
                                                <div key={v.id} style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#ddd' }}>{v.name}</div>
                                                        <div style={{ fontSize: '9px', color: '#666' }}>{new Date(v.releaseDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingRelease(v); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit2 size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {editingRelease && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '550px',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                            <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>EDIT_RELEASE_DATA</h3>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE_TITLE</label>
                                    <input
                                        value={editingRelease.name || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, name: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST_NAME</label>
                                    <input
                                        value={editingRelease.artistName || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, artistName: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE_DATE</label>
                                    <input
                                        type="date"
                                        value={new Date(editingRelease.releaseDate).toISOString().split('T')[0]}
                                        onChange={e => setEditingRelease({ ...editingRelease, releaseDate: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>TOTAL_STREAMS</label>
                                    <input
                                        value={editingRelease.streamCountText || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, streamCountText: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                        placeholder="e.g. 1.2M"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>POPULARITY (0-100)</label>
                                <input
                                    type="number"
                                    value={editingRelease.popularity || 0}
                                    onChange={e => setEditingRelease({ ...editingRelease, popularity: parseInt(e.target.value) })}
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button type="submit" disabled={saving} className="glow-button" style={{ flex: 2, padding: '15px', height: 'auto' }}>
                                    {saving ? 'UPDATING...' : 'SAVE_CHANGES'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingRelease(null)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        borderRadius: '16px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        cursor: 'pointer'
                                    }}
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function UsersView({ users, onRoleChange, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const roles = ['artist', 'a&r', 'admin'];
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.stageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEdit = (user) => {
        setEditingUser(user);
        let perms = {};
        try { perms = user.permissions ? JSON.parse(user.permissions) : {}; } catch (e) { }

        setEditForm({
            email: user.email || '',
            fullName: user.fullName || '',
            stageName: user.stageName || '',
            spotifyUrl: user.spotifyUrl || '',
            role: user.role || 'artist',
            status: user.status || 'pending',
            permissions: perms
        });
    };

    const handleSave = async (overrideData = null) => {
        setSaving(true);
        try {
            const data = overrideData || {
                userId: editingUser.id,
                ...editForm,
                permissions: JSON.stringify(editForm.permissions)
            };

            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!overrideData) {
                setEditingUser(null);
                showToast("User updated successfully", "success");
            }
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast('Save failed', "error");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = (userId) => {
        showConfirm(
            "APPROVE USER?",
            "Are you sure you want to approve this artist request? They will gain access to the dashboard.",
            async () => {
                await handleSave({ userId, status: 'approved' });
                showToast("User approved", "success");
            }
        );
    };

    const handleDelete = (userId) => {
        showConfirm(
            "DELETE USER?",
            "Are you sure you want to PERMANENTLY delete this user? This cannot be undone.",
            async () => {
                try {
                    await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
                    showToast("User deleted", "success");
                    onRefresh();
                } catch (e) {
                    console.error(e);
                    showToast('Delete failed', "error");
                }
            }
        );
    };

    return (
        <div>
            {/* Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '850px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                                <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>USER_ACCESS_CONTROL</h3>
                            </div>
                            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '24px' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>EMAIL_ADDRESS</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>FULL_NAME</label>
                                        <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STAGE_NAME</label>
                                        <input type="text" value={editForm.stageName} onChange={(e) => setEditForm({ ...editForm, stageName: e.target.value })}
                                            style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SYSTEM_ROLE</label>
                                    <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)' }}>
                                        {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ACCOUNT_STATUS</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', color: editForm.status === 'approved' ? '#00ff88' : '#ff4444' }}>
                                        <option value="pending">PENDING APPROVAL</option>
                                        <option value="approved">APPROVED</option>
                                        <option value="rejected">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px', fontWeight: '900', letterSpacing: '2px' }}>PORTAL_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {[
                                            { key: 'view_overview', label: 'OVERVIEW' },
                                            { key: 'view_support', label: 'SUPPORT' },
                                            { key: 'view_releases', label: 'RELEASES' },
                                            { key: 'view_demos', label: 'DEMOS' },
                                            { key: 'view_earnings', label: 'EARNINGS' },
                                            { key: 'view_contracts', label: 'CONTRACTS' },
                                            { key: 'view_profile', label: 'PROFILE' },
                                            { key: 'submit_demos', label: 'SUBMIT_DEMO' },
                                            { key: 'request_changes', label: 'REQUEST_CHANGE' }
                                        ].map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '9px', fontWeight: '800', color: editForm.permissions?.[p.key] !== false ? '#fff' : '#333' }}>
                                                <input type="checkbox"
                                                    checked={editForm.permissions?.[p.key] !== false}
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: '10px', color: '#666', marginBottom: '15px', fontWeight: '900', letterSpacing: '2px' }}>ADMIN_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {[
                                            { key: 'admin_view_overview', label: 'STATS' },
                                            { key: 'admin_view_submissions', label: 'DEMOS' },
                                            { key: 'admin_view_artists', label: 'ARTISTS' },
                                            { key: 'admin_view_contracts', label: 'CONTRACTS' },
                                            { key: 'admin_view_earnings', label: 'EARNINGS' },
                                            { key: 'admin_view_payments', label: 'PAYMENTS' },
                                            { key: 'admin_view_requests', label: 'REQUESTS' },
                                            { key: 'admin_view_users', label: 'USERS' },
                                            { key: 'admin_view_communications', label: 'COMMUNICATIONS' },
                                            { key: 'admin_view_content', label: 'CONTENT' },
                                            { key: 'admin_view_webhooks', label: 'WEBHOOKS' },
                                            { key: 'admin_view_settings', label: 'SETTINGS' }
                                        ].map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '9px', fontWeight: '800', color: editForm.permissions?.[p.key] === true ? 'var(--accent)' : '#333' }}>
                                                <input type="checkbox"
                                                    disabled={editForm.role === 'artist'}
                                                    checked={editForm.permissions?.[p.key] === true}
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={() => handleSave()} disabled={saving} className="glow-button" style={{ flex: 2, padding: '18px', fontWeight: '900' }}>
                                {saving ? 'APPLYING_CHANGES...' : 'SAVE_USER_PERMISSIONS'}
                            </button>
                            <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px', borderRadius: '16px' }}>
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
                <div style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>
                    {users.filter(u => u.status === 'pending').length} PENDING REGISTRATIONS
                </div>
            </div>

            <div style={{
                ...glassStyle,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.3s ease' }}>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {user.email}
                                        {user.emailVerified ? (
                                            <div title={`Verified: ${new Date(user.emailVerified).toLocaleDateString()}`} style={{ color: '#00ff88', display: 'flex' }}><CheckCircle size={12} /></div>
                                        ) : (
                                            <div title="Not Verified" style={{ color: 'var(--status-warning)', display: 'flex' }}><AlertCircle size={12} /></div>
                                        )}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#ccc' }}>{user.stageName || user.fullName || '---'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        color: user.role === 'admin' ? 'var(--accent)' : '#888',
                                        letterSpacing: '1px'
                                    }}>
                                        {user.role?.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        background: user.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(245, 197, 66, 0.1)',
                                        color: user.status === 'approved' ? '#00ff88' : 'var(--accent)',
                                        border: `1px solid ${user.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.05)'}`
                                    }}>
                                        {user.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {user.status === 'pending' && (
                                            <button onClick={() => handleApprove(user.id)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>APPROVE</button>
                                        )}
                                        <button onClick={() => openEdit(user)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>EDIT</button>
                                        <button onClick={() => handleDelete(user.id)} style={{ ...btnStyle, color: 'var(--status-error)', background: 'rgba(255,68,68,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '9px' }}>DELETE</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO USERS MATCHING SEARCH</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function WebhooksView({ webhooks, onRefresh, onTest }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState(null);
    const [form, setForm] = useState({ name: '', url: '', events: '', enabled: true });
    const [saving, setSaving] = useState(false);

    const eventOptions = [
        { value: 'new_track', label: 'New Track Released' },
        { value: 'playlist_update', label: 'Playlist Update' },
        { value: 'demo_submit', label: 'Demo Submitted' },
        { value: 'demo_approved', label: 'Demo Approved' },
        { value: 'demo_rejected', label: 'Demo Rejected' },
    ];

    const resetForm = () => {
        setForm({ name: '', url: '', events: '', enabled: true });
        setShowAdd(false);
        setEditingWebhook(null);
    };

    const openEdit = (webhook) => {
        setEditingWebhook(webhook);
        setForm({
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            enabled: webhook.enabled
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingWebhook) {
                await fetch('/api/admin/webhooks', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingWebhook.id, ...form })
                });
            } else {
                await fetch('/api/admin/webhooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }
            resetForm();
            showToast("Webhook configuration saved", "success");
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast('Save failed', "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        showConfirm(
            "DELETE WEBHOOK?",
            "Are you sure you want to delete this webhook? It will stop receiving events immediately.",
            async () => {
                try {
                    await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' });
                    showToast("Webhook deleted", "success");
                    onRefresh();
                } catch (e) {
                    console.error(e);
                    showToast("Delete failed", "error");
                }
            }
        );
    };

    const handleToggle = async (webhook) => {
        try {
            await fetch('/api/admin/webhooks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: webhook.id, enabled: !webhook.enabled })
            });
            onRefresh();
        } catch (e) { console.error(e); }
    };

    const testWebhook = async (url) => {
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{ title: '🔔 Webhook Test', description: 'This is a test notification from LOST Admin Panel.', color: 0x00ff88 }]
                })
            });
            showToast('Test webhook sent!', "success");
        } catch (e) { showToast('Test failed', "error"); }
    };

    return (
        <div>
            {/* Add/Edit Modal */}
            {(showAdd || editingWebhook) && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '500px',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '30px', height: '1px', background: 'var(--accent)' }}></div>
                                <h3 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#fff', margin: 0 }}>
                                    {editingWebhook ? 'EDIT_WEBHOOK' : 'ADD_NEW_WEBHOOK'}
                                </h3>
                            </div>
                            <button onClick={() => { setShowAdd(false); setEditingWebhook(null); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '24px' }}>×</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>WEBHOOK_NAME</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Discord Notifications"
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ENDPOINT_URL</label>
                                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    style={{ ...inputStyle, width: '100%', padding: '15px' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SUBSCRIBE_EVENTS</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {eventOptions.map(opt => {
                                        const isSelected = form.events.includes(opt.value);
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    const currentEvents = form.events ? form.events.split(',').filter(e => e) : [];
                                                    if (isSelected) {
                                                        setForm({ ...form, events: currentEvents.filter(e => e !== opt.value).join(',') });
                                                    } else {
                                                        setForm({ ...form, events: [...currentEvents, opt.value].join(',') });
                                                    }
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    fontSize: '9px',
                                                    fontWeight: '900',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                                                    color: isSelected ? '#000' : '#444',
                                                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {opt.label.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {form.events?.includes('playlist_update') && (
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '800', display: 'block', marginBottom: '8px' }}>TARGET_PLAYLIST_ID</label>
                                    <input
                                        type="text"
                                        placeholder="Spotify Playlist ID"
                                        value={form.config ? JSON.parse(form.config).playlistId || '' : ''}
                                        onChange={(e) => {
                                            const currentConfig = form.config ? JSON.parse(form.config) : {};
                                            setForm({ ...form, config: JSON.stringify({ ...currentConfig, playlistId: e.target.value }) });
                                        }}
                                        style={{ ...inputStyle, width: '100%', padding: '15px' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.url} className="glow-button" style={{ flex: 2, padding: '18px', fontWeight: '900' }}>
                                {saving ? 'PROCESSING...' : (editingWebhook ? 'UPDATE_WEBHOOK' : 'CREATE_WEBHOOK')}
                            </button>
                            <button onClick={() => { setShowAdd(false); setEditingWebhook(null); }} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px', borderRadius: '16px' }}>
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#fff', margin: 0 }}>AUTOMATION_WEBHOOKS</h3>
                    <p style={{ fontSize: '9px', color: '#444', marginTop: '5px', fontWeight: '800' }}>NOTIFY DISCORD OR OTHER SERVICES ON SYSTEM EVENTS</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '12px 25px' }}>+ NEW_WEBHOOK</button>
            </div>

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>NAME / ENDPOINT</th>
                            <th style={thStyle}>SUBSCRIPTIONS</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {webhooks.map(webhook => (
                            <tr key={webhook.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{webhook.name}</div>
                                    <div style={{ fontSize: '9px', color: '#444', marginTop: '4px', letterSpacing: '0.5px' }}>{webhook.url.substring(0, 60)}...</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {webhook.events?.split(',').filter(e => e).map(event => (
                                            <span key={event} style={{ fontSize: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', color: '#888', borderRadius: '4px', fontWeight: '800' }}>
                                                {event.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => handleToggle(webhook)}
                                        style={{
                                            background: webhook.enabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: webhook.enabled ? '#00ff88' : '#444',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            padding: '6px 12px',
                                            fontSize: '9px',
                                            cursor: 'pointer',
                                            fontWeight: '900',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {webhook.enabled ? 'ACTIVE' : 'DISABLED'}
                                    </button>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => testWebhook(webhook.url)} style={{ ...btnStyle, fontSize: '9px', background: 'rgba(255,255,255,0.02)' }}>TEST</button>
                                        <button onClick={() => setEditingWebhook(webhook)} style={{ ...btnStyle, fontSize: '9px', background: 'rgba(255,255,255,0.02)' }}>EDIT</button>
                                        <button onClick={() => handleDelete(webhook.id)} style={{ ...btnStyle, fontSize: '9px', color: 'var(--status-error)', background: 'rgba(255,68,68,0.05)' }}>DELETE</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {webhooks.length === 0 && (
                            <tr><td colSpan="4" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '60px' }}>NO_WEBHOOKS_CONFIGURED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ... (Existing ContentView)

const GoalProgress = ({ label, current, target, color }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const safeColor = color || 'var(--accent)';
    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#555' }}>{current.toLocaleString()} / {target.toLocaleString()}</span>
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

const DonutChart = ({ data }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const topItem = data.reduce((best, item) => (item.value > best.value ? item : best), data[0] || { label: 'TOTAL', value: 0, color: '#666' });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
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

function HomeView() {
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
            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            ...statCardStyle,
                            padding: '26px',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '20px'
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
                                color: card.color
                            }}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: '900', background: 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(0,255,136,0.25)' }}>
                                    {card.trend}
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', lineHeight: 1, marginBottom: '8px' }}>
                            {card.value}
                        </div>

                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
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

                {/* Recent Items */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
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
                        <h3 style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>RECENT_SUBMISSIONS</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <RefreshCw size={14} color="#555" style={{ cursor: 'pointer' }} onClick={fetchStats} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {stats.recent.demos.slice(0, 5).map((demo, i) => (
                            <div key={demo.id} style={{ padding: '16px 30px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{demo.title}</div>
                                    <div style={{ fontSize: '10px', color: '#444', fontWeight: '700' }}>{demo.artist?.stageName || 'Unknown'}</div>
                                </div>
                                <div style={{ fontSize: '9px', color: '#222', fontWeight: '900', background: 'rgba(255,255,255,0.02)', padding: '5px 12px', borderRadius: '12px' }}>
                                    {new Date(demo.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Data Tables: Earnings & Payouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '22px', marginBottom: '28px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ ...glassStyle, padding: '24px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>RECENT_EARNINGS</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Last 5</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.8fr', fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '1px', padding: '0 4px 8px' }}>
                        <span>PERIOD</span><span>SOURCE</span><span>LABEL</span><span>CREATED</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {miniEarnings.map((e, i) => (
                            <div key={e.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.8fr', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ color: '#fff', fontWeight: '800' }}>{e.period || '-'}</div>
                                <div style={{ color: '#999', fontWeight: '800' }}>{(e.source || 'OTHER').toUpperCase()}</div>
                                <div style={{ color: 'var(--accent)', fontWeight: '900' }}>${Number(e.labelAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <div style={{ color: '#555', fontWeight: '800' }}>{new Date(e.createdAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                        {miniEarnings.length === 0 && (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO_EARNINGS_YET</div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ ...glassStyle, padding: '24px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>RECENT_PAYOUTS</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Last 5</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '1px', padding: '0 4px 8px' }}>
                        <span>AMOUNT</span><span>STATUS</span><span>CREATED</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {miniPayments.map((p, i) => (
                            <div key={p.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ color: '#fff', fontWeight: '900' }}>${Number(p.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: p.status === 'completed' ? '#00ff88' : '#ffaa00' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.status === 'completed' ? '#00ff88' : '#ffaa00', boxShadow: `0 0 8px ${p.status === 'completed' ? '#00ff88' : '#ffaa00'}55` }} />
                                    {p.status?.toUpperCase() || 'PENDING'}
                                </div>
                                <div style={{ color: '#555', fontWeight: '800' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                        {miniPayments.length === 0 && (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO_PAYOUTS_YET</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row: Recent Requests */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
                    <h3 style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>ACTIVE_SERVICE_REQUESTS</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {stats.recent.requests.map((req, i) => (
                        <div key={req.id} style={{ padding: '18px 30px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px'
                                }}>
                                    {req.type === 'takedown' ? '🗑️' : req.type === 'cover_art' ? '🎨' : '📝'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{req.type.toUpperCase().replace('_', ' ')}</div>
                                    <div style={{ fontSize: '10px', color: '#444', fontWeight: '700' }}>{req.user?.stageName || 'Unknown'}</div>
                                </div>
                            </div>
                            <div style={{
                                fontSize: '9px',
                                padding: '6px 15px',
                                borderRadius: '20px',
                                background: req.status === 'pending' ? 'rgba(255, 170, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                                color: req.status === 'pending' ? '#ffaa00' : '#444',
                                fontWeight: '900',
                                border: `1px solid ${req.status === 'pending' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                                letterSpacing: '1px'
                            }}>
                                {req.status.toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </>
    );
}

function RequestsView({ requests, onUpdateStatus }) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const [processing, setProcessing] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        if (selectedRequest) {
            setAdminNote(selectedRequest.adminNote || '');
        }
    }, [selectedRequest]);

    const handleUpdate = async (id, status, extra = {}) => {
        const statusVerb = status === 'reviewing' ? 'start reviewing' :
            status === 'processing' ? 'start processing' :
                status === 'completed' ? 'complete' :
                    status === 'needs_action' ? 'mark as needing action' : status;

        showConfirm(
            `${status.toUpperCase().replace('_', ' ')}?`,
            `Are you sure you want to ${statusVerb} this request? This will notify the user.`,
            async () => {
                setProcessing(id);
                try {
                    await onUpdateStatus(id, status, adminNote, extra.assignedToId);
                    showToast(`Request ${status}`, "success");
                    if (selectedRequest && selectedRequest.id === id) {
                        setSelectedRequest(prev => ({ ...prev, status, adminNote, ...extra }));
                    }
                } catch (e) {
                    showToast("Failed to update request", "error");
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return { bg: 'var(--status-accent-bg)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'approved': return { bg: 'var(--status-accent-bg)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'processing': return { bg: 'var(--status-info-bg)', border: 'var(--status-info)', color: 'var(--status-info)' };
            case 'reviewing': return { bg: 'var(--status-warning-bg)', border: 'var(--status-warning)', color: 'var(--status-warning)' };
            case 'needs_action': return { bg: 'rgba(255, 240, 0, 0.1)', border: '#fff000', color: '#fff000' };
            case 'rejected': return { bg: 'var(--status-error-bg)', border: 'var(--status-error)', color: 'var(--status-error)' };
            default: return { bg: 'var(--status-neutral-bg)', border: '#666', color: '#666' };
        }
    };

    if (selectedRequest) {
        return (
            <div style={{ ...glassStyle, minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>←</button>
                        <h3 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>REQUEST DETAILS</h3>
                    </div>
                    <div style={{
                        display: 'flex', gap: '10px'
                    }}>
                        {!selectedRequest.assignedToId && (
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, selectedRequest.status, { assignedToId: session.user.id })}
                                style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', padding: '5px 12px', fontSize: '9px' }}
                            >
                                ASSIGN TO ME
                            </button>
                        )}
                        <div style={{
                            padding: '5px 12px',
                            background: getStatusStyles(selectedRequest.status).bg,
                            border: `1px solid ${getStatusStyles(selectedRequest.status).border}`,
                            color: getStatusStyles(selectedRequest.status).color,
                            fontSize: '11px', fontWeight: '800', letterSpacing: '1px'
                        }}>
                            {selectedRequest.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'flex', gap: '40px' }}>
                    {/* LEFT COLUMN: RELEASE INFO */}
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                            {selectedRequest.release?.image && (
                                <NextImage src={selectedRequest.release.image?.startsWith('private/') ? `/api/files/release/${selectedRequest.release.id}` : selectedRequest.release.image} alt="Release" width={400} height={400} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>RELEASE NAME</label>
                            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '5px' }}>{selectedRequest.release?.name}</div>
                            <a href={selectedRequest.release?.spotifyUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent)' }}>OPEN IN SPOTIFY ↗</a>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>ARTIST / REQUESTER</label>
                            <div style={{ fontSize: '14px' }}>{selectedRequest.user?.stageName}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{selectedRequest.user?.email}</div>
                        </div>
                        {selectedRequest.assignedTo && (
                            <div>
                                <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '800' }}>ASSIGNED STAFF</label>
                                <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{selectedRequest.assignedTo.stageName || selectedRequest.assignedTo.email}</div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: REQUEST DETAILS */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>REQUEST TYPE</label>
                            <div style={{ fontSize: '14px', background: '#222', padding: '10px 20px', borderRadius: '16px', display: 'inline-block', border: '1px solid var(--border)' }}>
                                {selectedRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>DESCRIPTION & FILES</label>
                            <div style={{
                                background: 'var(--surface-hover)',
                                padding: '20px',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                color: '#ddd',
                                minHeight: '120px'
                            }}>
                                {selectedRequest.details}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>ADMIN NOTE (VISIBLE TO ARTIST)</label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Status updates or rejection reason..."
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '13px',
                                    minHeight: '80px',
                                    borderRadius: '6px',
                                    outline: 'none focus:border-accent'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'reviewing')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(255, 170, 0, 0.1)', color: 'var(--status-warning)', borderColor: '#ffaa0030' }}
                            >
                                REVIEWING
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'processing')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(0, 170, 255, 0.1)', color: 'var(--status-info)', borderColor: '#00aaff30' }}
                            >
                                PROCESSING
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'needs_action')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(255, 240, 0, 0.1)', color: '#fff000', borderColor: '#fff00030' }}
                            >
                                NEEDS ACTION
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'completed')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(245, 197, 66, 0.18)', color: 'var(--accent)', borderColor: 'var(--accent)30' }}
                            >
                                COMPLETED
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'rejected')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, color: 'var(--status-error)', borderColor: '#ff444430' }}
                            >
                                REJECT
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONVERSATION SECTION */}
                <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '10px', color: '#666', fontWeight: '800', marginBottom: '20px', letterSpacing: '2px' }}>CONVERSATION HISTORY</h4>
                    <RequestComments request={selectedRequest} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...glassStyle, padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ ...tdStyle, color: '#666', fontSize: '9px', textAlign: 'left', padding: '15px 25px' }}>RELEASE</th>
                        <th style={{ ...tdStyle, color: '#666', fontSize: '9px', textAlign: 'left', padding: '15px 25px' }}>ARTIST</th>
                        <th style={{ ...tdStyle, color: '#666', fontSize: '9px', textAlign: 'left', padding: '15px 25px' }}>TYPE</th>
                        <th style={{ ...tdStyle, color: '#666', fontSize: '9px', textAlign: 'left', padding: '15px 25px' }}>STATUS</th>
                        <th style={{ ...tdStyle, color: '#666', fontSize: '9px', textAlign: 'right', padding: '15px 25px' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(req => (
                        <tr key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <td style={{ ...tdStyle, padding: '20px 25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '16px', overflow: 'hidden' }}>
                                        {req.release?.image && <NextImage src={req.release.image?.startsWith('private/') ? `/api/files/release/${req.release.id}` : req.release.image} alt={req.release.name || "Release"} width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: '13px' }}>{req.release?.name}</div>
                                </div>
                            </td>
                            <td style={{ ...tdStyle, padding: '20px 25px' }}>{req.user?.stageName}</td>
                            <td style={{ ...tdStyle, padding: '20px 25px', fontSize: '10px' }}>{req.type.toUpperCase().replace('_', ' ')}</td>
                            <td style={{ ...tdStyle, padding: '20px 25px' }}>
                                <span style={{
                                    padding: '4px 8px',
                                    background: getStatusStyles(req.status).bg,
                                    border: `1px solid ${getStatusStyles(req.status).border}`,
                                    color: getStatusStyles(req.status).color,
                                    fontSize: '9px', fontWeight: '900', borderRadius: '16px'
                                }}>
                                    {req.status.toUpperCase()}
                                </span>
                                {req._count?.comments > 0 && (
                                    <span style={{ marginLeft: '10px', fontSize: '9px', color: '#444' }}>💬 {req._count.comments}</span>
                                )}
                            </td>
                            <td style={{ ...tdStyle, padding: '20px 25px', textAlign: 'right' }}>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }} style={{ ...btnStyle, padding: '6px 15px' }}>DETAILS</button>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '80px' }}>NO REQUESTS FOUND</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function SettingsView() {
    const { showToast, showConfirm } = useToast();
    const [config, setConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [releaseOptions, setReleaseOptions] = useState([]);

    useEffect(() => {
        fetchSettings();
        fetchReleases();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.config) {
                let parsed;
                try {
                    parsed = JSON.parse(data.config);
                    // Handle potential double-stringification
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse config", e);
                    parsed = {};
                }

                setConfig({
                    // Requests
                    allowCoverArt: parsed.allowCoverArt ?? true,
                    allowAudio: parsed.allowAudio ?? true,
                    allowDelete: parsed.allowDelete ?? true,
                    allowOther: parsed.allowOther ?? true,
                    // General
                    siteName: parsed.siteName || 'LOST MUSIC',
                    registrationsOpen: parsed.registrationsOpen ?? true,
                    maintenanceMode: parsed.maintenanceMode ?? false,
                    adminEmail: parsed.adminEmail || '',
                    // Home Page
                    heroText: parsed.heroText || 'THE NEW ORDER',
                    heroSubText: parsed.heroSubText || 'INDEPENDENT DISTRIBUTION REDEFINED.',
                    featuredReleaseId: parsed.featuredReleaseId || '',
                    featuredReleaseLabel: parsed.featuredReleaseLabel || 'FEATURED RELEASE',
                    featuredReleaseSubLabel: parsed.featuredReleaseSubLabel || 'NOW STREAMING',
                    featuredReleaseStatus: parsed.featuredReleaseStatus || 'Featured',
                    showStats: parsed.showStats ?? true,
                    // Socials
                    discord: parsed.discord || '',
                    instagram: parsed.instagram || '',
                    spotify: parsed.spotify || '',
                    youtube: parsed.youtube || '',
                    twitter: parsed.twitter || '',
                    facebook: parsed.facebook || '',
                    // Genres
                    genres: parsed.genres || ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other'],
                    // Join Page
                    joinHeroTitle: parsed.joinHeroTitle || 'WORK WITH THE LOST. COMPANY',
                    joinHeroSub: parsed.joinHeroSub || 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
                });
            } else {
                // Defaults
                setConfig({
                    allowCoverArt: true, allowAudio: true, allowDelete: true, allowOther: true,
                    siteName: 'LOST MUSIC', registrationsOpen: true, maintenanceMode: false, adminEmail: '',
                    heroText: 'THE NEW ORDER', heroSubText: 'INDEPENDENT DISTRIBUTION REDEFINED.', featuredReleaseId: '',
                    featuredReleaseLabel: 'FEATURED RELEASE', featuredReleaseSubLabel: 'NOW STREAMING', featuredReleaseStatus: 'Featured',
                    showStats: true,
                    discord: '', instagram: '', spotify: '', youtube: '', twitter: '', facebook: '',
                    defaultPlaylistId: '6QHy5LPKDRHDdKZGBFxRY8',
                    genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other'],
                    joinHeroTitle: 'WORK WITH THE LOST. COMPANY',
                    joinHeroSub: 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchReleases = async () => {
        try {
            const res = await fetch('/api/releases');
            const data = await res.json();
            if (data?.releases) {
                setReleaseOptions(data.releases.slice(0, 50));
            }
        } catch (e) {
            console.error("Failed to fetch releases for settings", e);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            });
            showToast('System settings saved successfully', "success");
        } catch (e) {
            console.error(e);
            showToast('Failed to save settings', "error");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#444' }}>Loading settings...</div>;

    const tabs = [
        { id: 'general', label: 'GENERAL' },
        { id: 'system', label: 'SYSTEM' },
        { id: 'genres', label: 'GENRES' },
        { id: 'requests', label: 'REQUESTS' },
        { id: 'home', label: 'HOME PAGE' },
        { id: 'join', label: 'JOIN PAGE' },
        { id: 'socials', label: 'SOCIALS' }
    ];

    const inputStyle = {
        width: '100%',
        padding: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: '#fff',
        borderRadius: '16px',
        fontSize: '12px'
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            ...btnStyle,
                            background: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab.id ? '#000' : '#888',
                            border: 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ ...glassStyle, padding: '30px' }}>

                {/* GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>SITE NAME</label>
                            <input type="text" value={config.siteName} onChange={(e) => handleChange('siteName', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>ADMIN EMAIL</label>
                            <input type="email" value={config.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>DEFAULT PLAYLIST ID (SYNC)</label>
                            <input type="text" value={config.defaultPlaylistId} onChange={(e) => handleChange('defaultPlaylistId', e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #222', display: 'grid', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>REGISTRATIONS OPEN</span>
                                <div onClick={() => toggle('registrationsOpen')} style={{ width: '40px', height: '20px', background: config.registrationsOpen ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.registrationsOpen ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--status-error)' }}>MAINTENANCE MODE</span>
                                <div onClick={() => toggle('maintenanceMode')} style={{ width: '40px', height: '20px', background: config.maintenanceMode ? 'var(--status-error)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.maintenanceMode ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { label: 'TOTAL_USERS', value: users.length, icon: <Users size={16} /> },
                            { label: 'TOTAL_ARTISTS', value: artists.length, icon: <Music size={16} /> },
                            { label: 'TOTAL_RELEASES', value: artists.reduce((acc, a) => acc + (a._count?.releases || 0), 0), icon: <Disc size={16} /> },
                            { label: 'TOTAL_CONTRACTS', value: artists.reduce((acc, a) => acc + (a._count?.contracts || 0), 0), icon: <FileText size={16} /> },
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', marginBottom: '10px' }}>
                                    {stat.icon}
                                    <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '2px' }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* GENRES SETTINGS */}
                {activeTab === 'genres' && (
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="Add new genre..."
                                id="newGenreInput"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.trim();
                                        if (val && !config.genres.includes(val)) {
                                            handleChange('genres', [...config.genres, val]);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                                style={inputStyle}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('newGenreInput');
                                    const val = input.value.trim();
                                    if (val && !config.genres.includes(val)) {
                                        handleChange('genres', [...config.genres, val]);
                                        input.value = '';
                                    }
                                }}
                                style={{ ...btnStyle, background: 'var(--accent)', color: '#000', padding: '12px 20px', border: 'none', borderRadius: '16px' }}
                            >
                                ADD
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {config.genres.map(g => (
                                <div key={g} style={{
                                    padding: '10px 15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800' }}>{g}</span>
                                    <button
                                        onClick={() => handleChange('genres', config.genres.filter(genre => genre !== g))}
                                        style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REQUESTS SETTINGS */}
                {activeTab === 'requests' && (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {[{ k: 'allowCoverArt', l: 'Allow Cover Art Updates' }, { k: 'allowAudio', l: 'Allow Audio File Updates' }, { k: 'allowDelete', l: 'Allow Takedown Requests' }, { k: 'allowOther', l: 'Allow Other Requests' }].map(item => (
                            <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '800' }}>{item.l}</span>
                                <div onClick={() => toggle(item.k)} style={{ width: '40px', height: '20px', background: config[item.k] ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config[item.k] ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HOME PAGE SETTINGS */}
                {activeTab === 'home' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>HERO MAIN TEXT</label>
                            <input type="text" value={config.heroText} onChange={(e) => handleChange('heroText', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>HERO SUBTEXT</label>
                            <textarea value={config.heroSubText} onChange={(e) => handleChange('heroSubText', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: '800', color: '#666' }}>FEATURED CARD LABELS</label>
                            <input
                                type="text"
                                value={config.featuredReleaseLabel}
                                onChange={(e) => handleChange('featuredReleaseLabel', e.target.value)}
                                placeholder="FEATURED RELEASE"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={config.featuredReleaseSubLabel}
                                onChange={(e) => handleChange('featuredReleaseSubLabel', e.target.value)}
                                placeholder="NOW STREAMING"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={config.featuredReleaseStatus}
                                onChange={(e) => handleChange('featuredReleaseStatus', e.target.value)}
                                placeholder="Featured"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>FEATURED RELEASE ID (Hero highlight)</label>
                            <select
                                value={config.featuredReleaseId}
                                onChange={(e) => handleChange('featuredReleaseId', e.target.value)}
                                style={{ ...inputStyle, background: '#0d0d0d' }}
                            >
                                <option value="">(Auto-pick latest)</option>
                                {releaseOptions.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} — {r.artistName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                                Anasayfa hero&apos;da görünecek release. Seçilmezse en güncel release kullanılır.
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '800' }}>SHOW STATS SECTION</span>
                            <div onClick={() => toggle('showStats')} style={{ width: '40px', height: '20px', background: config.showStats ? 'var(--accent)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.showStats ? '22px' : '2px', transition: 'left 0.3s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* JOIN PAGE SETTINGS */}
                {activeTab === 'join' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>JOIN PAGE TITLE</label>
                            <input type="text" value={config.joinHeroTitle} onChange={(e) => handleChange('joinHeroTitle', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>JOIN PAGE SUBTITLE</label>
                            <input type="text" value={config.joinHeroSub} onChange={(e) => handleChange('joinHeroSub', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(245, 197, 66, 0.05)', border: '1px solid rgba(245, 197, 66, 0.1)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800', margin: 0 }}>TIP: Detailed information like Accepted Genres and Commission Table are managed in the &ldquo;CONTENT&rdquo; section of the Admin Dashboard.</p>
                        </div>
                    </div>
                )}

                {/* SOCIALS SETTINGS */}
                {activeTab === 'socials' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {['discord', 'instagram', 'spotify', 'youtube', 'twitter', 'facebook'].map(social => (
                            <div key={social}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: '800', color: '#666' }}>{social.toUpperCase()} URL</label>
                                <input type="text" value={config[social]} onChange={(e) => handleChange(social, e.target.value)} style={inputStyle} placeholder={`https://${social}.com/...`} />
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={saving} className="glow-button" style={{ fontSize: '12px', padding: '12px 30px' }}>
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ContentView({ content, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const [editing, setEditing] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [faqItems, setFaqItems] = useState([]); // Added for structured FAQ editing
    const [saving, setSaving] = useState(false);

    const contentTypes = [
        { key: 'faq', label: 'FAQ / Sıkça Sorulan Sorular' },
        { key: 'join_genres', label: 'Join Us: Accepted Genres' },
        { key: 'join_commissions', label: 'Join Us: Commission Table' },
        { key: 'terms', label: 'Terms of Service' },
        { key: 'privacy', label: 'Privacy Policy' },
        { key: 'commission_rules', label: 'Commission Rules / Komisyon Kuralları' }
    ];

    const DEFAULT_CONTENT = {
        faq: JSON.stringify([
            { q: "How do I submit a demo?", a: "Register as an artist, access your portal, and use the 'NEW SUBMISSION' button. You can now upload multiple files (Master, Lyrics, etc.) directly." },
            { q: "How can I track my distribution?", a: "Once signed, our A&R team will provide updates through the portal. You can use the 'CHANGE REQUEST' system to manage revisions or metadata updates for your releases." },
            { q: "How do royalties and payments work?", a: "Royalties from Spotify, Apple Music, and other DSPs are calculated monthly. You can view your detailed revenue breakdown in the 'EARNINGS' tab and request withdrawals once the $50 threshold is met." },
            { q: "What about legal contracts?", a: "All signing contracts are generated digitally. You can view, download, and track the status of your contracts in the 'CONTRACTS' section of your Artist Dashboard." },
            { q: "Do you offer Spotify sync?", a: "Yes. Our system automatically syncs with your Spotify Artist profile to fetch the latest release data and update your portal metrics." }
        ]),
        join_genres: "House (Deep House / Slap House / G-House)\nPop\nPhonk\nHardstyle\nHyperTechno\nGaming Music (Midtempo, D&B, Trap, Future Bass)\nReggaeton\nOther",
        join_commissions: JSON.stringify([
            { released: "Yes", listeners: "0 – 250K", commission: "$25 or 1% royalties" },
            { released: "Yes", listeners: "250K – 750K", commission: "$50 or 2.5% royalties" },
            { released: "Yes", listeners: "750K+", commission: "$75 or 5% royalties" },
            { released: "No", listeners: "0 – 250K", commission: "$25 or 5% royalties" },
            { released: "No", listeners: "250K – 500K", commission: "$50 or 5% royalties" },
            { released: "No", listeners: "500K – 1M", commission: "$75 or 5% royalties" },
            { released: "No", listeners: "1M+", commission: "$100 or 7.5% royalties" }
        ]),
        commission_rules: "1. Only high-quality original demos are accepted.\n2. No uncleared samples or copyrighted material.\n3. Commissions are paid out 30 days after the track is signed and processed.\n4. We reserve the right to decline any submission for any reason.",
        terms: "1. ARTIST ELIGIBILITY: By registering with LOST MUSIC GROUP, you affirm that you are at least 18 years of age (or have legal guardian consent) and possess the full authority to enter into a distribution agreement for the musical works you submit.\n\n2. DEMO SUBMISSIONS & CONTENT STANDARDS: Submitting a demo does not guarantee a release. You represent that all submissions are 100% original works. Use of uncleared samples, stolen tracks, or fraudulent content will result in immediate account termination and potential legal action.\n\n3. GLOBAL DISTRIBUTION RIGHTS: Upon formal acceptance and contract execution, you grant LOST MUSIC GROUP the exclusive, sub-licensable right to distribute, promote, and monetize your content across over 50 global Digital Service Providers (DSPs), including Spotify, Apple Music, and Amazon.\n\n4. ROYALTIES & PAYMENTS: Royalties are calculated based on net revenue received from DSPs. Payouts are made quarterly (every 3 months) via Bank Transfer or PayPal. The minimum payout threshold is $50.00 USD. Undistributed earnings remain in your account until the threshold is met.\n\n5. INTELLECTUAL PROPERTY: The \"LOST.\" trademark, logos, and website infrastructure remain the sole property of LOST MUSIC GROUP. Artists retain ownership of their compositions unless otherwise specified in a separate, written Recording or Publishing Agreement.",
        privacy: "1. DATA COLLECTION: We collect personal identifiers (name, email, stage name), financial information for royalty processing, and musical content submitted through our portal. We also collect technical data such as IP addresses and browser cookies to improve your user experience and for security purposes.\n\n2. PURPOSE OF DATA USAGE: Your data is used exclusively to manage your artist profile, evaluate demo submissions, facilitate contract execution, and process royalty payments. We may also use your contact information to provide critical system updates or A&R feedback.\n\n3. DATA PROTECTION & DISCLOSURE: We implement professional-grade encryption (Bcrypt for passwords, SSL/TLS for data in transit) to safeguard your information. We do not sell your data. Disclosure only occurs to trusted third-party partners (e.g., DSPs, payment processors) necessary to fulfill our distribution and payment obligations.\n\n4. YOUR RIGHTS (GDPR/CCPA): You have the right to access, correct, or request the deletion of your personal data at any time. You may also request a copy of the data we hold about you. For such inquiries, please contact our data compliance team through the Support portal."
    };

    const handleEdit = (item, type = null) => {
        const key = item?.key || type?.key;
        setEditing(key || null);
        setEditTitle(item?.title || type?.label || '');
        const contentStr = item?.content || DEFAULT_CONTENT[key] || '';
        setEditContent(contentStr);

        // Handle structured FAQ items
        if (key === 'faq') {
            try {
                const parsed = contentStr ? JSON.parse(contentStr) : [];
                setFaqItems(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setFaqItems([]);
            }
        }

        // Auto-handle JSON content for commissions if needed
        if (key === 'join_commissions') {
            try {
                const parsed = contentStr ? JSON.parse(contentStr) : [];
                setFaqItems(Array.isArray(parsed) ? parsed : []); // Reuse state or add new one? Let's reuse for simplicity if structure is similar
            } catch (e) {
                setFaqItems([]);
            }
        }
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            let finalContent = editContent;
            if (editing === 'faq' || editing === 'join_commissions') {
                finalContent = JSON.stringify(faqItems);
            }

            await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: editing, title: editTitle, content: finalContent })
            });
            setEditing(null);
            onRefresh();
            showToast("Content updated successfully", "success");
            onRefresh();
        } catch (e) { console.error(e); showToast('Save failed', "error"); }
        finally { setSaving(false); }
    };

    const addFaqItem = () => setFaqItems([...faqItems, { q: '', a: '' }]);
    const removeFaqItem = (index) => setFaqItems(faqItems.filter((_, i) => i !== index));
    const updateFaqItem = (index, field, value) => {
        const newItems = [...faqItems];
        newItems[index][field] = value;
        setFaqItems(newItems);
    };

    const getContent = (key) => content.find(c => c.key === key);

    return (
        <div>
            <p style={{ color: '#666', fontSize: '11px', marginBottom: '30px' }}>
                Edit site content like FAQ and Commission rules. Changes are saved immediately.
            </p>

            <div style={{ display: 'grid', gap: '20px' }}>
                {contentTypes.map(type => {
                    const item = getContent(type.key);
                    const isEditing = editing === type.key;

                    return (
                        <div key={type.key} style={{ ...glassStyle, padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--accent)' }}>
                                        {type.key === 'faq' ? <MessageSquare size={16} /> :
                                            type.key.includes('join') ? <Target size={16} /> :
                                                type.key.includes('commission') ? <DollarSign size={16} /> : <FileText size={16} />}
                                    </div>
                                    <h3 style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1px' }}>{type.label.toUpperCase()}</h3>
                                </div>
                                {!isEditing && (
                                    <button onClick={() => handleEdit(item, type)} style={{ ...btnStyle, color: 'var(--accent)', background: 'rgba(255,102,0,0.05)', padding: '8px 20px', borderRadius: '12px' }}>
                                        {item ? 'EDIT CONTENT' : 'CUSTOMIZE'}
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.01)',
                                        padding: '30px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        marginTop: '20px'
                                    }}
                                >
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px', marginBottom: '8px' }}>DISPLAY TITLE</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Section Title..."
                                            style={{ width: '100%', padding: '12px 15px', background: '#000', border: '1px solid var(--border)', color: '#fff', borderRadius: '10px', fontSize: '12px' }}
                                        />
                                    </div>

                                    {editing === 'faq' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px' }}>FAQ BUILDER</label>
                                            {faqItems.map((item, index) => (
                                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900' }}>QUESTION {index + 1}</span>
                                                        <button onClick={() => removeFaqItem(index)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '9px', padding: '5px 10px', borderRadius: '6px' }}>REMOVE</button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.q}
                                                        onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                                                        placeholder="The question..."
                                                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                                                    />
                                                    <textarea
                                                        value={item.a}
                                                        onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                                                        placeholder="The answer..."
                                                        rows={3}
                                                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid rgba(255,255,255,0.05)', color: '#888', borderRadius: '8px', resize: 'vertical', fontSize: '12px' }}
                                                    />
                                                </div>
                                            ))}
                                            <button onClick={addFaqItem} style={{ ...btnStyle, alignSelf: 'flex-start', border: '1px dashed var(--border)', width: '100%', padding: '15px' }}>+ ADD NEW QUESTION</button>
                                        </div>
                                    ) : editing === 'join_commissions' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px' }}>COMMISSION ROWS</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 40px', gap: '10px', padding: '0 10px', fontSize: '9px', color: '#333' }}>
                                                <span>RELEASED</span>
                                                <span>LISTENERS RANGE</span>
                                                <span>RATE/AMOUNT</span>
                                                <span></span>
                                            </div>
                                            {faqItems.map((item, index) => (
                                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                                                    <select
                                                        value={item.released || 'No'}
                                                        onChange={(e) => updateFaqItem(index, 'released', e.target.value)}
                                                        style={{ padding: '10px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                                                    >
                                                        <option value="Yes">YES</option>
                                                        <option value="No">NO</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={item.listeners || ''}
                                                        onChange={(e) => updateFaqItem(index, 'listeners', e.target.value)}
                                                        placeholder="e.g. 100K - 500K"
                                                        style={{ padding: '10px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.commission || ''}
                                                        onChange={(e) => updateFaqItem(index, 'commission', e.target.value)}
                                                        placeholder="e.g. 5% Royalties"
                                                        style={{ padding: '10px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                                                    />
                                                    <button onClick={() => removeFaqItem(index)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px', fontWeight: '900' }}>×</button>
                                                </div>
                                            ))}
                                            <button onClick={() => setFaqItems([...faqItems, { released: 'No', listeners: '', commission: '' }])} style={{ ...btnStyle, alignSelf: 'flex-start', border: '1px dashed var(--border)', width: '100%', padding: '12px' }}>+ ADD NEW ROW</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#444', letterSpacing: '2px', marginBottom: '8px' }}>CONTENT EDITOR</label>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                placeholder={editing === 'join_genres' ? "Enter genres separated by new lines or commas..." : "Enter document content..."}
                                                rows={editing === 'join_genres' ? 12 : 15}
                                                style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid var(--border)', color: '#bbb', borderRadius: '12px', resize: 'vertical', fontSize: '13px', lineHeight: '1.6' }}
                                            />
                                            <p style={{ fontSize: '10px', color: '#444', marginTop: '10px' }}>TIP: Use double-enter for new paragraphs.</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                        <button onClick={handleSave} disabled={saving} className="glow-button" style={{ padding: '12px 35px', borderRadius: '12px', fontSize: '11px' }}>
                                            {saving ? 'PUBLISHING...' : 'SAVE & PUBLISH'}
                                        </button>
                                        <button onClick={() => setEditing(null)} style={{ ...btnStyle, padding: '12px 25px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>DISCARD</button>
                                    </div>
                                </motion.div>
                            ) : item ? (
                                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>LIVE:</span> {item.title}
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#444', fontWeight: '800' }}>LAST UPDATED: {new Date(item.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        background: 'rgba(0,0,0,0.1)',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        color: '#555',
                                        maxHeight: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '11px', color: '#444' }}>
                                    <p style={{ marginBottom: '10px' }}>Site using system defaults. Use "CUSTOMIZE" to override with your own content.</p>
                                    <div style={{
                                        padding: '15px',
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        maxHeight: '100px',
                                        overflow: 'hidden',
                                        opacity: 0.5,
                                        fontSize: '10px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {(() => {
                                            const def = DEFAULT_CONTENT[type.key];
                                            if (!def) return 'No preview available.';
                                            try {
                                                const parsed = JSON.parse(def);
                                                if (Array.isArray(parsed)) {
                                                    if (type.key === 'faq') return parsed.map((f, i) => `Q: ${f.q}`).join('\n');
                                                    if (type.key === 'join_commissions') return parsed.map((c, i) => `${c.listeners}: ${c.commission}`).join('\n');
                                                }
                                                return def;
                                            } catch (e) { return def; }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const ArtistPicker = ({ artists, value, onChange, placeholder = "Select Artist...", onClear }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    // Initial value display logic
    const selectedArtist = artists.find(a => a.id === value);
    const displayValue = searchTerm || (selectedArtist ? selectedArtist.name : '');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredArtists = artists.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                placeholder={placeholder}
                value={displayValue}
                onFocus={() => {
                    setSearchTerm('');
                    setShowDropdown(true);
                }}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                }}
                style={{ ...inputStyle, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px', width: '100%' }}
            />
            {value && !showDropdown && onClear && (
                <button
                    type="button"
                    onClick={() => { onClear(); setSearchTerm(''); }}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ff4444', fontSize: '16px', cursor: 'pointer' }}
                >×</button>
            )}

            {showDropdown && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '16px',
                    maxHeight: '200px', overflowY: 'auto', zIndex: 100,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    marginTop: '5px'
                }}>
                    {filteredArtists.length > 0 ? filteredArtists.map(a => (
                        <div
                            key={a.id}
                            onClick={() => {
                                onChange(a);
                                setSearchTerm('');
                                setShowDropdown(false);
                            }}
                            style={{ padding: '10px', borderBottom: '1px solid #222', cursor: 'pointer', fontSize: '12px', color: '#ccc' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#222'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 'bold' }}>{a.name}</div>
                            {a.user && <div style={{ fontSize: '10px', color: '#666' }}>{a.user.email} {a.user.stageName ? `(${a.user.stageName})` : ''}</div>}
                        </div>
                    )) : (
                        <div style={{ padding: '10px', color: '#666', fontSize: '12px' }}>No matches found</div>
                    )}
                    <div
                        onClick={() => {
                            if (onClear) onClear();
                            setSearchTerm('');
                            setShowDropdown(false);
                        }}
                        style={{ padding: '10px', borderTop: '1px solid #222', color: 'var(--status-error)', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}
                    >
                        CLEAR SELECTION
                    </div>
                </div>
            )}
        </div>
    );
};

function SplitRow({ split, index, onUpdate, onRemove, artists, effectiveShare }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredArtists = artists.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 40px', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input
                placeholder="Name (e.g. LXGHTLXSS)"
                value={split.name}
                onChange={e => {
                    const newName = e.target.value;
                    // Auto-link logic: Try to find exact match
                    const match = artists.find(a => a.name.toLowerCase() === newName.toLowerCase());
                    const update = { ...split, name: newName };

                    if (match) {
                        update.artistId = match.id;
                        update.userId = match.userId || '';
                    }
                    // Optional: If we want to UNLINK when name no longer matches, uncomment below
                    // else if (split.artistId) { 
                    //     // Check if the current linked artist name still matches, if not, maybe keep it or unlink? 
                    //     // For now let's only auto-link POSITIVE matches to avoid accidental unlinking of manual selections
                    // }

                    onUpdate(update);
                }}
                style={{ ...inputStyle, padding: '8px' }}
            />
            <div style={{ position: 'relative' }}>
                <input
                    type="number"
                    placeholder="Share"
                    value={split.percentage}
                    onChange={e => onUpdate({ ...split, percentage: e.target.value })}
                    style={{ ...inputStyle, padding: '8px', paddingRight: '20px' }}
                />
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#444' }}>%</span>
            </div>

            {effectiveShare && (
                <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', lineHeight: '1' }}>
                    <div style={{ fontWeight: '900', color: 'var(--accent)' }}>{effectiveShare}%</div>
                    <div style={{ fontSize: '7px' }}>OF TOTAL</div>
                </div>
            )}

            <ArtistPicker
                artists={artists}
                value={split.artistId}
                placeholder="Select Artist..."
                onChange={(a) => onUpdate({ ...split, artistId: a.id, userId: a.user?.id || '', name: a.name })}
                onClear={() => onUpdate({ ...split, artistId: '', userId: '' })}
            />

            <button
                type="button"
                onClick={onRemove}
                style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer' }}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

function ContractsView({ contracts, onRefresh, artists, releases, demos = [] }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        userId: '',
        artistId: '',
        primaryArtistName: '', // Fallback for display
        releaseId: '',
        title: '',
        isDemo: false,
        artistShare: 0.70,
        labelShare: 0.30,
        notes: '',
        pdfUrl: '',
        isValid: true,
        splits: [{ name: '', percentage: 100, userId: '', artistId: '' }]
    });
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const pdfInputRef = useRef(null);

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPdf(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/contracts/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setForm({ ...form, pdfUrl: data.pdfUrl });
                showToast("PDF uploaded successfully", "success");
            } else {
                showToast(data.error || "Upload failed", "error");
            }
        } catch (e) { showToast("Error uploading PDF", "error"); }
        finally { setUploadingPdf(false); }
    };

    const handleSubmitContract = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingContract ? '/api/contracts' : '/api/contracts';
            const method = editingContract ? 'PATCH' : 'POST';
            const body = {
                ...form,
                splits: form.splits.filter(s => s.name.trim() !== '')
            };
            if (editingContract) body.id = editingContract.id;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingContract(null);
                showToast(`Contract ${editingContract ? 'updated' : 'created'} successfully`, "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save contract", "error");
            }
        } catch (e) { showToast("Error saving contract", "error"); }
        finally { setSaving(false); }
    };

    const handleDeleteContract = async (id) => {
        showConfirm(
            "DELETE CONTRACT?",
            "Are you sure you want to delete this contract? All linked earnings and data will be lost forever.",
            async () => {
                try {
                    const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Contract deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Failed to delete contract", "error");
                    }
                } catch (e) {
                    showToast("Error deleting contract", "error");
                }
            }
        );
    };

    const totalSplit = form.splits.reduce((s, a) => s + parseFloat(a.percentage || 0), 0);

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => {
                        if (!showAdd) {
                            setForm({
                                userId: '',
                                artistId: '',
                                primaryArtistName: '',
                                releaseId: '',
                                title: '',
                                isDemo: false,
                                artistShare: 0.70,
                                labelShare: 0.30,
                                notes: '',
                                pdfUrl: '',
                                isValid: true,
                                splits: [{ name: '', percentage: 100, userId: '', artistId: '' }]
                            });
                        }
                        setShowAdd(!showAdd);
                    }}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> NEW CONTRACT
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid var(--accent)' }}
                >
                    <form onSubmit={handleSubmitContract} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>PRIMARY ARTIST</label>
                                <button type="button" onClick={() => {
                                    setForm({ ...form, splits: [...form.splits, { name: '', percentage: 0, userId: '', artistId: '' }] });
                                    // Scroll to bottom or highlight splits?
                                }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', cursor: 'pointer' }}>
                                    + ADD FEATURED ARTIST
                                </button>
                            </div>
                            <ArtistPicker
                                artists={artists}
                                value={form.artistId}
                                onChange={(artist) => {
                                    const update = {
                                        artistId: artist.id,
                                        userId: artist.userId || '', // Explicitly link user if available
                                        primaryArtistName: artist.name
                                    };

                                    // Logic to auto-update splits if they are default
                                    let newSplits = [...form.splits];
                                    if (newSplits.length === 1 && (newSplits[0].name === '' || newSplits[0].name === form.primaryArtistName)) {
                                        newSplits[0] = { name: artist.name, percentage: 100, userId: artist.userId || '', artistId: artist.id };
                                    }

                                    setForm({ ...form, ...update, splits: newSplits });
                                }}
                                onClear={() => setForm({ ...form, artistId: '', userId: '', primaryArtistName: '' })}
                            />
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                                Don&apos;t see the artist? <button onClick={() => showToast('Please go to the Artists tab to create a new profile first.', "info")} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Create Profile</button>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE / APPROVED DEMO</label>
                            <select
                                value={form.releaseId || form.demoId || ''} // Handle both releaseId and demoId
                                onChange={e => {
                                    const val = e.target.value;
                                    // Check if it's a Release or a Demo
                                    const release = releases.find(r => r.id === val);
                                    const demo = demos.find(d => d.id === val);

                                    let newSplits = [...form.splits];
                                    let update = { ...form };

                                    if (release) {
                                        update.releaseId = release.id;
                                        update.demoId = '';
                                        update.title = ''; // Reset custom title if release selected

                                        // Attempt to parse artists from Release JSON
                                        if (release.artistsJson) {
                                            try {
                                                const artists = JSON.parse(release.artistsJson);
                                                if (artists.length > 0) {
                                                    newSplits = artists.map(a => {
                                                        const regArtist = artists.find(reg => reg.name === a.name || reg.stageName === a.name);
                                                        return {
                                                            name: a.name,
                                                            percentage: Math.floor(100 / artists.length),
                                                            userId: regArtist ? regArtist.id : '',
                                                            artistId: regArtist ? regArtist.id : ''
                                                        };
                                                    });
                                                    // Auto set primary artist if possible
                                                    if (artists[0]) update.primaryArtistName = artists[0].name;
                                                }
                                            } catch (e) { console.error("Parse splits error", e); }
                                        }
                                    } else if (demo) {
                                        update.releaseId = '';
                                        update.demoId = demo.id;
                                        update.title = demo.title; // Use demo title
                                        // Demo usually has one artist linked
                                        // We could try to set primary artist from Demo's artist if linked?
                                        // demo.artistId is User ID usually in Schema?
                                        // Wait, Demo artistId is User ID. 
                                        // We might match it to an Artist Entity if linked.
                                    } else {
                                        update.releaseId = '';
                                        update.demoId = '';
                                    }

                                    update.splits = newSplits;
                                    setForm(update);
                                }}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="">Select Release or Approved Demo...</option>
                                <optgroup label="Approved Demos (Not Released)">
                                    {demos.map(d => (
                                        <option key={d.id} value={d.id}>DEMO: {d.title} ({new Date(d.createdAt).toLocaleDateString()})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Spotify Releases">
                                    {releases.map(r => {
                                        let displayArtist = r.artistName;
                                        if (r.artistsJson) {
                                            try {
                                                const allArtists = JSON.parse(r.artistsJson);
                                                if (Array.isArray(allArtists) && allArtists.length > 0) {
                                                    displayArtist = allArtists.map(a => a.name).join(', ');
                                                }
                                            } catch (e) { }
                                        }
                                        return <option key={r.id} value={r.id}>RELEASE: {r.name} - {displayArtist}</option>;
                                    })}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST SHARE (0.0 - 1.0)</label>
                            <input
                                type="number" step="0.01" min="0" max="1"
                                value={form.artistShare}
                                onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setForm({ ...form, artistShare: val, labelShare: Math.max(0, 1 - val) });
                                }}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>LABEL SHARE (Calculated)</label>
                            <input
                                type="number" step="0.01" min="0" max="1"
                                value={form.labelShare}
                                onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0 && val <= 1) {
                                        // If label share is changed manually, do we update artist share?
                                        // Usually they sum to 1. But user might want custom splits.
                                        // Let's assume strict 1.0 sum for now, so updating label updates artist.
                                        setForm({ ...form, labelShare: val, artistShare: parseFloat((1 - val).toFixed(2)) });
                                    }
                                }}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <label style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>ADDITIONAL ARTISTS & SPLITS</label>
                                <button
                                    type="button"
                                    onClick={() => setForm({
                                        ...form,
                                        splits: [...form.splits, { name: '', percentage: 0, userId: '', artistId: '' }]
                                    })}
                                    style={{ ...btnStyle, fontSize: '10px', padding: '5px 10px' }}
                                >
                                    + ADD ARTIST / CONTRIBUTOR
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '10px' }}>
                                {form.splits.map((split, index) => (
                                    <SplitRow
                                        key={index}
                                        split={split}
                                        index={index}
                                        artists={artists}
                                        effectiveShare={((parseFloat(split.percentage || 0) / 100) * form.artistShare * 100).toFixed(1)}
                                        onUpdate={(updated) => {
                                            const newSplits = [...form.splits];
                                            newSplits[index] = updated;
                                            setForm({ ...form, splits: newSplits });
                                        }}
                                        onRemove={() => setForm({ ...form, splits: form.splits.filter((_, i) => i !== index) })}
                                    />
                                ))}
                            </div>

                            <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '10px', color: totalSplit !== 100 ? 'var(--status-error)' : 'var(--accent)' }}>
                                TOTAL SPLIT: {totalSplit}% (SHOULD BE 100%)
                            </div>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SIGNED CONTRACT PDF (OPTIONAL)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="file" accept=".pdf"
                                    ref={pdfInputRef}
                                    onChange={handlePdfUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => pdfInputRef.current?.click()}
                                    style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                                >
                                    {uploadingPdf ? 'UPLOADING...' : form.pdfUrl ? 'REPLACE PDF' : 'SELECT PDF'}
                                </button>
                                {form.pdfUrl && (
                                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '800' }}>
                                        <CheckCircle size={10} style={{ marginRight: '5px' }} /> PDF UPLOADED
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>NOTES</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px', minHeight: '60px' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                                {saving ? 'SAVING...' : editingContract ? 'SAVE CHANGES' : 'CREATE CONTRACT'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>RELEASE</th>
                            <th style={thStyle}>ARTIST</th>
                            <th style={thStyle}>SPLIT</th>
                            <th style={thStyle}>EARNINGS</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>PDF</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.map(c => (
                            <tr key={c.id}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{c.release?.name || c.title || 'Untitled Contract'}</div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{c.releaseId ? 'SPOTIFY_RELEASE' : 'MANUAL / DEMO'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800' }}>{c.artist?.name || c.primaryArtistName || c.user?.stageName || 'Unknown Artist'}</div>
                                    {c.splits.length > 1 && (
                                        <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                                            + {c.splits.length - 1} OTHERS: {c.splits.filter(s => s.name !== (c.primaryArtistName || c.user?.stageName)).map(s => s.name).join(', ')}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                                        {c.user ? (
                                            <span style={{ color: 'var(--accent)' }}>LINKED: {c.user.email}</span>
                                        ) : (
                                            <span style={{ color: '#666' }}>NO ACCOUNT LINKED</span>
                                        )}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900' }}>
                                            ARTIST: <span style={{ color: 'var(--accent)' }}>{Math.round(c.artistShare * 100)}%</span> / LABEL: <span style={{ color: 'var(--accent)' }}>{Math.round(c.labelShare * 100)}%</span>
                                        </div>
                                        {c.splits?.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                                                {c.splits.map((s, i) => (
                                                    <span key={i} style={{ fontSize: '8px', padding: '2px 5px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)', color: '#888' }}>
                                                        {s.name}: <span style={{ color: '#fff' }}>{s.percentage}%</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    {c._count?.earnings || 0} Records
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '9px', padding: '4px 8px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', fontWeight: '900' }}>
                                        {c.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {c.pdfUrl ? (
                                        <a href={`/api/files/contract/${c.id}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '5px 10px', fontSize: '8px' }}>
                                            VIEW PDF
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: '8px', color: '#333' }}>MISSING</span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => {
                                        setEditingContract(c);
                                        setForm({
                                            userId: c.userId || '',
                                            artistId: c.artistId || '',
                                            primaryArtistName: c.primaryArtistName || '',
                                            releaseId: c.releaseId || '',
                                            isDemo: !c.releaseId,
                                            // Handle demoId logic if needed, but releaseId check suffices usually
                                            artistShare: c.artistShare,
                                            labelShare: c.labelShare,
                                            notes: c.notes || '',
                                            pdfUrl: c.pdfUrl || '',
                                            isValid: true,
                                            splits: c.splits.map(s => ({
                                                name: s.name,
                                                percentage: s.percentage,
                                                userId: s.userId || '',
                                                artistId: s.artistId || ''
                                            }))
                                        });
                                        setShowAdd(true);
                                    }} style={{ ...btnStyle, marginRight: '5px' }}>
                                        EDIT
                                    </button>
                                    <button onClick={() => handleDeleteContract(c.id)} style={{ ...btnStyle, color: 'var(--status-error)' }}>
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {contracts.length === 0 && (
                            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO CONTRACTS DEFINED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EarningsView({ earnings, onRefresh, contracts, pagination, onPageChange }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null); // New: Track which ID is being edited
    const [form, setForm] = useState({
        contractId: '',
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        grossAmount: '',
        expenseAmount: '', // New field for Ad Spend / Expenses
        streams: '',
        source: 'spotify'
    });

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/earnings/${editingId}` : '/api/earnings';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingId(null); // Reset editing state
                setForm({
                    contractId: '',
                    period: new Date().toISOString().slice(0, 7),
                    grossAmount: '',
                    expenseAmount: '',
                    streams: '',
                    source: 'spotify'
                });
                showToast(editingId ? "Earning record updated" : "Earning record added", "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save earning", "error");
            }
        } catch (e) { showToast("Error saving earning", "error"); }
        finally { setSaving(false); }
    };

    const handleEdit = (earning) => {
        setEditingId(earning.id);
        setForm({
            contractId: earning.contractId,
            period: earning.period,
            grossAmount: earning.grossAmount,
            expenseAmount: earning.expenseAmount || '',
            streams: earning.streams || '',
            source: earning.source || 'spotify'
        });
        setShowAdd(true);
    };

    const handleDelete = (id) => {
        showConfirm(
            "DELETE RECORD?",
            "Are you sure you want to delete this earning record? This cannot be undone.",
            async () => {
                try {
                    const res = await fetch(`/api/earnings/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Failed to delete", "error");
                    }
                } catch (e) { showToast("Error deleting", "error"); }
            }
        );
    };

    const totalGross = earnings.reduce((sum, e) => sum + (e.grossAmount || 0), 0);
    const totalArtist = earnings.reduce((sum, e) => sum + (e.artistAmount || 0), 0);
    const totalLabel = earnings.reduce((sum, e) => sum + (e.labelAmount || 0), 0);
    const totalExpense = earnings.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);

    const spendByRelease = Object.values(earnings.reduce((acc, e) => {
        const key = e.contract?.release?.name || 'Unknown';
        acc[key] = acc[key] || { name: key, spend: 0, revenue: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].revenue += e.labelAmount || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 5);

    const spendBySource = Object.values(earnings.reduce((acc, e) => {
        const key = (e.source || 'OTHER').toUpperCase();
        acc[key] = acc[key] || { source: key, spend: 0, streams: 0 };
        acc[key].spend += e.expenseAmount || 0;
        acc[key].streams += e.streams || 0;
        return acc;
    }, {})).sort((a, b) => b.spend - a.spend).slice(0, 6);

    return (
        <div>
            <div className="earnings-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px', marginBottom: '24px' }}>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>ARTIST PAYOUTS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>LABEL EARNINGS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>${totalLabel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>AD SPEND</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffaa00' }}>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setForm({
                            contractId: '',
                            period: new Date().toISOString().slice(0, 7),
                            grossAmount: '',
                            expenseAmount: '',
                            streams: '',
                            source: 'spotify'
                        });
                        setShowAdd(!showAdd);
                    }}
                    style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> {showAdd && !editingId ? 'CLOSE' : 'ADD MANUAL EARNING'}
                </button>
            </div>

            {/* Spend analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '22px' }}>
                <div style={{ ...glassStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>TOP RELEASES BY AD SPEND</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {spendByRelease.map((r, i) => {
                            const pct = totalExpense ? Math.round((r.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <div style={{ color: '#fff', fontWeight: '900' }}>{r.name}</div>
                                        <div style={{ color: '#ffaa00', fontWeight: '900' }}>${r.spend.toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '800', marginBottom: '6px' }}>REV: ${r.revenue.toLocaleString()} • {pct}% of spend</div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 10px #ffaa0055' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {spendByRelease.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>

                <div style={{ ...glassStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#fff', margin: 0 }}>SPEND BY SOURCE</h3>
                        <span style={{ fontSize: '9px', color: '#666', fontWeight: '800' }}>Top 6</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {spendBySource.map((s, i) => {
                            const pct = totalExpense ? Math.round((s.spend / totalExpense) * 100) : 0;
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 40px', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px' }}>
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
                            <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: '900' }}>NO SPEND DATA</div>
                        )}
                    </div>
                </div>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid #fff' }}
                >
                    <div style={{ marginBottom: '15px', color: editingId ? 'var(--accent)' : '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '2px' }}>
                        {editingId ? 'EDITING EARNING RECORD' : 'NEW EARNING RECORD'}
                    </div>
                    <form className="earnings-form" onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>CONTRACT (RELEASE + ARTIST)</label>
                            <select
                                value={form.contractId}
                                onChange={e => setForm({ ...form, contractId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="">Select Contract...</option>
                                {contracts.map(c => {
                                    const releaseName = c.release?.name || c.title || 'Untitled Release';
                                    const artistName = c.artist?.name || c.user?.stageName || c.user?.fullName || c.primaryArtistName || 'Unknown Artist';
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {releaseName} - {artistName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>PERIOD (YYYY-MM)</label>
                            <input
                                type="month"
                                value={form.period}
                                onChange={e => setForm({ ...form, period: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GROSS AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.grossAmount}
                                onChange={e => setForm({ ...form, grossAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AD SPEND / EXPENSES ($)</label>
                            <input
                                type="number" step="0.01"
                                value={form.expenseAmount}
                                onChange={e => setForm({ ...form, expenseAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STREAMS (OPTIONAL)</label>
                            <input
                                type="number"
                                value={form.streams}
                                onChange={e => setForm({ ...form, streams: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SOURCE</label>
                            <select
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="spotify">Spotify</option>
                                <option value="apple">Apple Music</option>
                                <option value="youtube">YouTube</option>
                                <option value="ad_revenue">Ad Revenue (Meta/TikTok/etc)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                                {saving ? 'SAVING...' : (editingId ? 'UPDATE RECORD' : 'ADD RECORD')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>PERIOD</th>
                            <th style={thStyle}>RELEASE / ARTIST</th>
                            <th style={thStyle}>GROSS</th>
                            <th style={thStyle}>EXPENSES</th>
                            <th style={thStyle}>ARTIST PAY</th>
                            <th style={thStyle}>STREAMS</th>
                            <th style={thStyle}>SOURCE</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {earnings.map(e => (
                            <tr key={e.id}>
                                <td style={tdStyle}>{e.period}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{e.contract?.release?.name}</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{e.contract?.user?.stageName || e.contract?.user?.fullName}</div>
                                </td>
                                <td style={tdStyle}>${e.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={tdStyle}>${(e.expenseAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={tdStyle}>
                                    <div style={{ color: 'var(--accent)', fontWeight: '800' }}>${e.artistAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style={{ fontSize: '8px', color: '#444' }}>({Math.round(e.contract?.artistShare * 100)}%)</div>
                                </td>
                                <td style={tdStyle}>{e.streams?.toLocaleString() || '---'}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '11px', color: '#fff', textTransform: 'uppercase', fontWeight: '800' }}>{e.source}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(e)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                                            title="Edit"
                                        >
                                            <Edit2 size={14} color="#aaa" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(e.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} color="var(--status-error)" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {earnings.length === 0 && (
                            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO EARNING RECORDS FOUND</td></tr>
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

function PaymentsView({ payments, onRefresh, users }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        userId: '',
        amount: '',
        method: 'bank_transfer',
        reference: '',
        notes: '',
        status: 'completed'
    });

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingPayment ? '/api/payments' : '/api/payments';
            const method = editingPayment ? 'PATCH' : 'POST';
            const body = { ...form };
            if (editingPayment) body.id = editingPayment.id;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingPayment(null);
                showToast(`Payment ${editingPayment ? 'updated' : 'recorded'} successfully`, "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save payment", "error");
            }
        } catch (e) { showToast("Error saving payment", "error"); }
        finally { setSaving(false); }
    };

    const handleDeletePayment = async (id) => {
        showConfirm(
            "DELETE PAYMENT?",
            "Are you sure you want to delete this payment record?",
            async () => {
                try {
                    const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Payment record deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Delete failed", "error");
                    }
                } catch (e) { showToast("Delete error", "error"); }
            }
        );
    };

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => {
                        if (!showAdd) {
                            setForm({
                                userId: '',
                                amount: '',
                                method: 'bank_transfer',
                                reference: '',
                                notes: '',
                                status: 'completed'
                            });
                            setEditingPayment(null);
                        }
                        setShowAdd(!showAdd);
                    }}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> RECORD PAYMENT
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid var(--accent)' }}
                >
                    <form onSubmit={handleSubmitPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST / USER</label>
                            <select
                                value={form.userId}
                                onChange={e => setForm({ ...form, userId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="">Select Recipient...</option>
                                {users.filter(u => u.role === 'artist' || u.role === 'a&r' || u.role === 'admin').map(u => (
                                    <option key={u.id} value={u.id}>{u.stageName || u.fullName} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>METHOD</label>
                            <select
                                value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="paypal">PayPal</option>
                                <option value="wise">Wise</option>
                                <option value="crypto">Crypto</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>REFERENCE / ID</label>
                            <input
                                type="text"
                                value={form.reference}
                                onChange={e => setForm({ ...form, reference: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STATUS</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
                            >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: 'var(--accent)', color: '#000' }}>
                                {saving ? 'SAVING...' : editingPayment ? 'SAVE CHANGES' : 'RECORD PAYMENT'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={glassStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>DATE</th>
                            <th style={thStyle}>RECIPIENT</th>
                            <th style={thStyle}>AMOUNT</th>
                            <th style={thStyle}>METHOD</th>
                            <th style={thStyle}>REFERENCE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.id}>
                                <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{p.user?.stageName || p.user?.fullName}</div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{p.user?.email}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent)' }}>${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>{p.method?.replace('_', ' ')}</span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>{p.reference || '---'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px', padding: '4px 8px', borderRadius: '16px',
                                        background: p.status === 'completed' ? 'rgba(245, 197, 66, 0.18)' : 'rgba(255,255,255,0.05)',
                                        color: p.status === 'completed' ? 'var(--accent)' : '#888',
                                        fontWeight: '900'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => {
                                        setEditingPayment(p);
                                        setForm({
                                            userId: p.userId || '',
                                            amount: p.amount,
                                            method: p.method,
                                            reference: p.reference || '',
                                            notes: p.notes || '',
                                            status: p.status
                                        });
                                        setShowAdd(true);
                                    }} style={{ ...btnStyle, marginRight: '5px' }}>
                                        EDIT
                                    </button>
                                    <button onClick={() => handleDeletePayment(p.id)} style={{ ...btnStyle, color: 'var(--status-error)' }}>
                                        DELETE
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO PAYMENTS RECORDED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function RequestComments({ request }) {
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

    if (loading) return <div style={{ fontSize: '11px', color: '#444' }}>LOADING COMMENTS...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div ref={scrollRef} style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' }}>
                {/* Initial Request Description */}
                <div style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '20px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#666', letterSpacing: '1px' }}>
                            INITIAL_REQUEST
                        </span>
                        <span style={{ fontSize: '8px', color: '#444' }}>{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#aaa', fontStyle: 'italic' }}>{request.details}</div>
                </div>

                {comments.map(c => {
                    const isMe = c.userId === session.user.id;
                    const isStaff = c.user.role === 'admin' || c.user.role === 'a&r';

                    return (
                        <div key={c.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            background: isMe ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '20px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: isStaff ? 'var(--accent)' : '#fff', letterSpacing: '1px' }}>
                                    {c.user.stageName?.toUpperCase() || c.user.email?.toUpperCase()} {isStaff ? '[STAFF]' : '[ARTIST]'}
                                </span>
                                <span style={{ fontSize: '8px', color: '#444' }}>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ccc' }}>{c.content}</div>
                        </div>
                    );
                })}
                {comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#333', fontSize: '10px', fontWeight: '800', letterSpacing: '2px' }}>NO REPLIES YET</div>
                )}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type your message to the artist..."
                    style={{ flex: 1, padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '16px' }}
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

function CommunicationsView({ artists }) {
    const { showToast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendToAll, setSendToAll] = useState(true);
    const [selectedArtistIds, setSelectedArtistIds] = useState([]);
    const [results, setResults] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            showToast("Subject and message are required", "error");
            return;
        }

        if (!sendToAll && selectedArtistIds.length === 0) {
            showToast("Select at least one artist", "error");
            return;
        }

        setSending(true);
        setResults(null);
        try {
            const res = await fetch('/api/admin/communications/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    html: message.replace(/\n/g, '<br>'),
                    recipientIds: sendToAll ? null : selectedArtistIds,
                    sendToAll
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast(`Successfully sent ${data.successCount} emails`, "success");
                setResults(data);
                if (data.failureCount === 0) {
                    setSubject('');
                    setMessage('');
                    setSelectedArtistIds([]);
                }
            } else {
                showToast(data.error || "Failed to send emails", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("An error occurred while sending emails", "error");
        } finally {
            setSending(false);
        }
    };

    const toggleArtist = (id) => {
        setSelectedArtistIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const glassStyle = {
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px',
        overflow: 'hidden'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: '#fff',
        borderRadius: '16px',
        fontSize: '12px'
    };

    const btnStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        color: '#666',
        padding: '8px 16px',
        fontSize: '9px',
        cursor: 'pointer',
        fontWeight: '900',
        letterSpacing: '2px',
        textDecoration: 'none',
        borderRadius: '12px',
        transition: 'all 0.3s'
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={glassStyle}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>COMPOSE_BROADCAST</h2>
                </div>
                <form onSubmit={handleSend} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: '900', color: '#444' }}>SUBJECT</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter subject..." style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: '900', color: '#444' }}>MESSAGE (PLACEHOLDER: {"{{name}}"})</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hello {{name}}..." style={{ ...inputStyle, minHeight: '250px' }} />
                    </div>
                    <button disabled={sending || !subject || !message} className="glow-button" style={{ width: '100%', padding: '15px', fontWeight: '900', letterSpacing: '2px' }}>
                        {sending ? 'SENDING...' : 'SEND COMMUNICATIONS'}
                    </button>
                    {results && (
                        <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center' }}>
                            Last distribution: {results.successCount} sent, {results.failureCount} failed.
                        </div>
                    )}
                </form>

                <div style={{ padding: '0 25px 25px 25px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#444', marginBottom: '15px' }}>PREVIEW</div>
                    <div style={{
                        background: '#0d0e10',
                        border: '1px solid #1a1c1e',
                        borderRadius: '16px',
                        padding: '20px',
                        fontSize: '11px',
                        color: '#888',
                        lineHeight: '1.6'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>LOST.</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '10px', textTransform: 'uppercase', textAlign: 'center' }}>{subject || 'SUBJECT'}</div>
                        <div style={{ marginBottom: '15px' }}>Hello Artist,</div>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#fff',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {message || 'Your message will appear here...'}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '8px', color: '#444' }}>
                            © {new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={glassStyle}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>RECIPIENTS</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setSendToAll(true)} style={{ ...btnStyle, background: sendToAll ? 'var(--accent)' : 'transparent', color: sendToAll ? '#000' : '#444' }}>ALL</button>
                        <button onClick={() => setSendToAll(false)} style={{ ...btnStyle, background: !sendToAll ? 'var(--accent)' : 'transparent', color: !sendToAll ? '#000' : '#444' }}>SELECTIVE</button>
                    </div>
                </div>
                <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
                    {sendToAll ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: '10px', fontWeight: '800' }}>
                            TARGETING ALL {artists.length} ARTISTS
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {artists.filter(a => a.email).map(a => (
                                <div key={a.id} onClick={() => toggleArtist(a.id)} style={{
                                    padding: '12px',
                                    background: selectedArtistIds.includes(a.id) ? 'rgba(var(--accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                    borderRadius: '12px',
                                    border: `1px solid ${selectedArtistIds.includes(a.id) ? 'var(--accent)' : 'transparent'}`,
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                }}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{a.name}</div>
                                    <div style={{ fontSize: '9px', color: '#666' }}>{a.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div >
    );
}
