"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic2, Disc, FileAudio, AlertCircle, RefreshCw, Trash2, Edit3, CheckCircle, XCircle, Briefcase, DollarSign, CreditCard, Plus, HelpCircle, MessageSquare, ArrowLeft, SendHorizontal, Edit, Edit2, Download } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';

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

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/earnings');
            const data = await res.json();
            setEarnings(data.earnings || []);
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
        settings: 'admin_view_settings'
    };

    if (!loading && !hasAdminPermission(viewToPerm[view])) {
        // ... (existing components)
    }

    return (
        <div style={{ padding: '0px' }}>
            {/* ... (existing components) */}

            {view === 'overview' && <HomeView />}
            {view === 'submissions' && <SubmissionsView demos={submissions} onUpdateStatus={handleStatusUpdate} />}
            {view === 'artists' && <ArtistsView artists={artists} users={users} unlistedUsers={unlistedUsers} onSync={handleSyncStats} />}
            {view === 'users' && <UsersView users={users} onRoleChange={handleRoleChange} onRefresh={fetchUsers} />}
            {view === 'requests' && <RequestsView requests={requests} onUpdateStatus={handleRequestStatusUpdate} />}
            {view === 'contracts' && <ContractsView contracts={contracts} artists={artists} releases={releases} demos={submissions.filter(s => s.status === 'approved')} onRefresh={fetchContracts} />}
            {view === 'earnings' && <EarningsView earnings={earnings} contracts={contracts} onRefresh={fetchEarnings} />}
            {view === 'payments' && <PaymentsView payments={payments} users={users} onRefresh={fetchPayments} />}
            {view === 'content' && <ContentView content={siteContent} onRefresh={fetchContent} />}
            {view === 'webhooks' && <WebhooksView webhooks={webhooks} onRefresh={fetchWebhooks} />}
            {view === 'releases' && <ReleasesView releases={releases} />}
            {view === 'settings' && <SettingsView />}

        </div>
    );
}

// ============ VIEWS ============

const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
};

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
    borderRadius: '8px',
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
    borderRadius: '8px',
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
            case 'approved': return 'var(--accent)';
            case 'rejected': return '#ff4444';
            case 'reviewing': return '#ffaa00';
            default: return '#666';
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
        <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                                style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>{u.stageName || 'No Stage Name'} <span style={{ color: '#666' }}>({u.email})</span></span>
                                <span style={{ color: 'var(--accent)', fontSize: '9px', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '4px' }}>SELECT</span>
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

function ArtistsView({ artists, users, onSync }) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const canManage = session?.user?.role === 'admin' || session?.user?.permissions?.canManageArtists;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newArtist, setNewArtist] = useState({ name: '', spotifyUrl: '', email: '' });
    const [saving, setSaving] = useState(false);

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
                        {selectedArtist.image ? <img src={selectedArtist.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>👤</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedArtist.name}</h2>
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>{selectedArtist.email || 'No Email Linked'}</div>
                        {selectedArtist.spotifyUrl && <a href={selectedArtist.spotifyUrl} target="_blank" style={{ color: 'var(--accent)', fontSize: '11px', textDecoration: 'none', display: 'block', marginTop: '5px' }}>OPEN SPOTIFY ↗</a>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '5px' }}>MONTHLY LISTENERS</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: selectedArtist.monthlyListeners ? 'var(--accent)' : '#ff4444' }}>
                            {selectedArtist.monthlyListeners?.toLocaleString() || (
                                <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <AlertCircle size={14} /> SYNC NEEDED
                                </span>
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSync(selectedArtist.userId, selectedArtist.spotifyUrl, selectedArtist.id);
                            }}
                            className="glow-button"
                            style={{ padding: '8px 20px', fontSize: '11px', marginTop: '10px' }}
                        >
                            <RefreshCw size={12} style={{ marginRight: '5px' }} /> SYNC SPOTIFY
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
                                    style={{ ...btnStyle, marginTop: '15px', color: '#ff4444', borderColor: '#ff444430', width: '100%', justifyContent: 'center' }}
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
                    <button onClick={() => setIsCreating(true)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none' }}>
                        <Plus size={14} /> NEW ARTIST
                    </button>
                )}
            </div>

            {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass" style={{ width: '400px', padding: '30px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>CREATE NEW ARTIST</h3>
                        <input
                            placeholder="Artist Name *"
                            value={newArtist.name}
                            onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                            style={{ ...inputStyle, marginBottom: '10px' }}
                        />
                        <input
                            placeholder="Email (Optional)"
                            value={newArtist.email}
                            onChange={(e) => setNewArtist({ ...newArtist, email: e.target.value })}
                            style={{ ...inputStyle, marginBottom: '10px' }}
                        />
                        <input
                            placeholder="Spotify URL (Optional)"
                            value={newArtist.spotifyUrl}
                            onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                            style={{ ...inputStyle, marginBottom: '20px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleCreate} disabled={saving} style={{ ...btnStyle, flex: 1, justifyContent: 'center', background: 'var(--accent)', color: '#000' }}>
                                {saving ? 'CREATING...' : 'CREATE'}
                            </button>
                            <button onClick={() => setIsCreating(false)} style={{ ...btnStyle, flex: 1, justifyContent: 'center' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--surface)' }}>
                            <th style={thStyle}>ARTIST</th>
                            <th style={thStyle}>MONTHLY</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>LINKED USER</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArtists.map(artist => (
                            <tr key={artist.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedArtist(artist)}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{artist.name}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)' }}>{artist.monthlyListeners?.toLocaleString() || '---'}</div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{artist.lastSyncedAt ? new Date(artist.lastSyncedAt).toLocaleDateString() : 'NEVER'}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(245, 197, 66, 0.18)', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                                </td>
                                <td style={tdStyle}>
                                    {artist.user ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '10px' }}>{artist.user.email}</span>
                                            <span style={{ color: '#666', fontSize: '9px' }}>{artist.user.stageName}</span>
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
                                            style={{ ...btnStyle, fontSize: '10px', padding: '5px 10px', background: 'rgba(255,255,255,0.05)' }}
                                        >
                                            <RefreshCw size={10} />
                                        </button>
                                        <button style={{ ...btnStyle, fontSize: '10px', padding: '5px 10px' }}>MANAGE</button>
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
    const [activeTab, setActiveTab] = useState('all'); // 'upcoming', 'all'
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
                        // Trigger refresh? We might need to lift state or reload. 
                        // For now, let's just reload page or ask parent to refresh if possible.
                        // Ideally onRefresh prop should be passed to ReleasesView if checking updates.
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

        if (activeTab === 'upcoming') {
            return matchesSearch && new Date(r.releaseDate) > new Date();
        }
        return matchesSearch;
    });

    const getBaseTitle = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/\s*-\s*(slowed|super slowed|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version)\s*$/i, '')
            .replace(/\s*\((slowed|super slowed|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version)\)\s*$/i, '')
            .trim();
    };

    const getVariants = (release) => {
        const base = getBaseTitle(release.name);
        if (!base) return [];
        return releases
            .filter(r => r.id !== release.id && getBaseTitle(r.name) === base)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'upcoming' ? '#fff' : '#666', borderBottom: activeTab === 'upcoming' ? '2px solid var(--accent)' : '2px solid transparent', paddingBottom: '5px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', letterSpacing: '1px' }}
                    >
                        UPCOMING
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'all' ? '#fff' : '#666', borderBottom: activeTab === 'all' ? '2px solid var(--accent)' : '2px solid transparent', paddingBottom: '5px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', letterSpacing: '1px' }}
                    >
                        ALL RELEASES
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search releases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredReleases.map(release => {
                    const variants = getVariants(release);
                    const isOpen = expandedReleaseId === release.id;
                    return (
                        <div
                            key={release.id}
                            style={{ ...glassStyle, padding: '20px', cursor: variants.length ? 'pointer' : 'default' }}
                            onClick={() => variants.length && setExpandedReleaseId(isOpen ? null : release.id)}
                        >
                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--surface-hover)', marginBottom: '15px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {release.image ? (
                                <img src={release.image?.startsWith('private/') ? `/api/files/release/${release.id}` : release.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Disc size={40} color="#222" />
                            )}
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {release.name}
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800', marginBottom: '5px' }}>
                            {release.artistName || 'Unknown Artist'}
                        </p>
                        <p style={{ fontSize: '10px', color: '#666' }}>
                            {new Date(release.releaseDate || release.createdAt).toLocaleDateString()}
                        </p>
                        {variants.length > 0 && (
                            <div style={{ marginTop: '10px', fontSize: '10px', color: '#888', letterSpacing: '1px' }}>
                                {isOpen ? 'HIDE VERSIONS' : `SHOW VERSIONS (${variants.length})`}
                            </div>
                        )}
                        {isOpen && variants.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
                                {variants.map(v => (
                                    <div key={v.id} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff' }}>{v.name}</div>
                                        <div style={{ fontSize: '9px', color: '#777' }}>{new Date(v.releaseDate || v.createdAt).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Edit/Delete Overlay */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingRelease(release); }}
                                style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '10px', fontWeight: '800' }}
                            >
                                EDIT
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(release.id); }}
                                style={{ padding: '8px', background: 'rgba(255,68,68,0.1)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#ff4444' }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                    );
                })}

                {filteredReleases.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#444', fontSize: '11px', letterSpacing: '2px' }}>
                        NO RELEASES FOUND
                    </div>
                )}
            </div>


            {/* Edit Modal */}
            {
                editingRelease && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ ...glassStyle, padding: '30px', width: '500px', maxWidth: '90vw', border: '1px solid var(--border)' }}
                        >
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginBottom: '20px' }}>EDIT RELEASE</h3>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE TITLE</label>
                                    <input
                                        value={editingRelease.name || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST NAME</label>
                                    <input
                                        value={editingRelease.artistName || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, artistName: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE DATE</label>
                                        <input
                                            type="date"
                                            value={new Date(editingRelease.releaseDate).toISOString().split('T')[0]}
                                            onChange={e => setEditingRelease({ ...editingRelease, releaseDate: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GENRE</label>
                                        <input
                                            value={editingRelease.genre || ''}
                                            onChange={e => setEditingRelease({ ...editingRelease, genre: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SPOTIFY URL</label>
                                    <input
                                        value={editingRelease.spotifyUrl || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, spotifyUrl: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>COVER IMAGE URL</label>
                                    <input
                                        value={editingRelease.image || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, image: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setEditingRelease(null)} style={btnStyle}>CANCEL</button>
                                    <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </div >
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
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="glass" style={{ padding: '30px', width: '800px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: '800' }}>EDIT USER & PERMISSIONS</h3>
                            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#444', marginBottom: '5px', fontWeight: '800' }}>EMAIL_ADDRESS</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#444', marginBottom: '5px', fontWeight: '800' }}>FULL_NAME</label>
                                    <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#444', marginBottom: '5px', fontWeight: '800' }}>STAGE_NAME</label>
                                    <input type="text" value={editForm.stageName} onChange={(e) => setEditForm({ ...editForm, stageName: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#444', marginBottom: '5px', fontWeight: '800' }}>SYSTEM_ROLE</label>
                                    <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', background: '#0d0d0d' }}>
                                        {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#444', marginBottom: '5px', fontWeight: '800' }}>ACCOUNT_STATUS</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', background: '#0d0d0d', color: editForm.status === 'approved' ? 'var(--accent)' : '#ff4444' }}>
                                        <option value="pending">PENDING APPROVAL</option>
                                        <option value="approved">APPROVED</option>
                                        <option value="rejected">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: '#444', marginBottom: '10px', fontWeight: '900', letterSpacing: '1px' }}>ARTIST_PORTAL_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.01)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
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
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '700', color: editForm.permissions?.[p.key] ? '#fff' : '#444' }}>
                                                <input type="checkbox"
                                                    checked={editForm.permissions?.[p.key] !== false} // Default to true if not specified
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: '10px', color: '#444', marginBottom: '10px', fontWeight: '900', letterSpacing: '1px' }}>ADMIN_PORTAL_PERMISSIONS</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.01)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        {[
                                            { key: 'admin_view_overview', label: 'DASHBOARD' },
                                            { key: 'admin_view_submissions', label: 'SUBMISSIONS' },
                                            { key: 'admin_view_artists', label: 'ARTIST_LIST' },
                                            { key: 'admin_view_contracts', label: 'CONTRACTS' },
                                            { key: 'admin_view_earnings', label: 'EARNINGS' },
                                            { key: 'admin_view_payments', label: 'PAYMENTS' },
                                            { key: 'admin_view_requests', label: 'CHANGES' },
                                            { key: 'admin_view_users', label: 'USERS' },
                                            { key: 'admin_view_content', label: 'CONTENT' },
                                            { key: 'admin_view_webhooks', label: 'WEBHOOKS' },
                                            { key: 'admin_view_settings', label: 'SETTINGS' }
                                        ].map(p => (
                                            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '700', color: editForm.permissions?.[p.key] ? 'var(--accent)' : '#444' }}>
                                                <input type="checkbox"
                                                    disabled={editForm.role === 'artist'}
                                                    checked={editForm.permissions?.[p.key] === true}
                                                    onChange={(e) => setEditForm({ ...editForm, permissions: { ...editForm.permissions, [p.key]: e.target.checked } })}
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
                            <button onClick={() => handleSave()} disabled={saving} className="glow-button" style={{ flex: 1, padding: '15px', fontWeight: '900' }}>
                                {saving ? 'SAVING_CHANGES...' : 'SAVE_PERMISSIONS'}
                            </button>
                            <button onClick={() => setEditingUser(null)} style={{ flex: 0.5, padding: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px' }}>
                                CANCEL
                            </button>
                        </div>
                    </div>
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

            <div className="glass" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--surface-hover)' }}>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #1a1a1b', background: user.status === 'pending' ? 'rgba(255,170,0,0.02)' : 'transparent' }}>
                                <td style={tdStyle}>{user.email}</td>
                                <td style={tdStyle}>{user.stageName || user.fullName || '---'}</td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: user.role === 'admin' ? 'var(--accent)' : '#888' }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: user.status === 'approved' ? 'rgba(245, 197, 66, 0.18)' : user.status === 'pending' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                                        color: user.status === 'approved' ? 'var(--accent)' : user.status === 'pending' ? '#ffaa00' : '#ff4444'
                                    }}>
                                        {user.status?.toUpperCase() || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {user.status === 'pending' && (
                                            <button onClick={() => handleApprove(user.id)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none' }}>APPROVE</button>
                                        )}
                                        <button onClick={() => openEdit(user)} style={btnStyle}>EDIT</button>
                                        <button onClick={() => handleDelete(user.id)} style={{ ...btnStyle, color: '#ff4444' }}>DELETE</button>
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
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="glass" style={{ padding: '30px', width: '450px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '25px', letterSpacing: '2px' }}>
                            {editingWebhook ? 'EDIT WEBHOOK' : 'ADD WEBHOOK'}
                        </h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>NAME</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., New Release Alerts"
                                style={{ width: '100%', padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>WEBHOOK URL</label>
                            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                                placeholder="https://discord.com/api/webhooks/..."
                                style={{ width: '100%', padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '8px', fontWeight: '800' }}>EVENTS</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                                                padding: '6px 12px',
                                                fontSize: '9px',
                                                background: isSelected ? 'var(--accent)' : '#111',
                                                color: isSelected ? '#000' : '#666',
                                                border: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                fontWeight: '800'
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Config Field (Playlist ID) */}
                        {form.events?.includes('playlist_update') && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: '900', color: '#666', letterSpacing: '1px' }}>TARGET PLAYLIST ID</label>
                                <input
                                    type="text"
                                    placeholder="Spotify Playlist ID (e.g. 6QHy5LPK...)"
                                    value={form.config ? JSON.parse(form.config).playlistId || '' : ''}
                                    onChange={(e) => {
                                        const currentConfig = form.config ? JSON.parse(form.config) : {};
                                        setForm({ ...form, config: JSON.stringify({ ...currentConfig, playlistId: e.target.value }) });
                                    }}
                                    style={inputStyle}
                                />
                                <p style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>If empty, the system default playlist will be used.</p>
                            </div>
                        )}

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                                <span style={{ fontSize: '10px', color: '#888', fontWeight: '800' }}>ENABLED</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} disabled={saving} className="glow-button" style={{ flex: 1, padding: '12px' }}>
                                {saving ? 'SAVING...' : 'SAVE'}
                            </button>
                            <button onClick={resetForm} style={{ flex: 1, padding: '12px', background: '#222', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <p style={{ color: '#666', fontSize: '12px' }}>Manage webhook endpoints for Discord notifications.</p>
                <button onClick={() => setShowAdd(true)} style={{ ...btnStyle, color: '#fff', background: 'var(--accent)', color: '#000', border: 'none' }}>+ ADD WEBHOOK</button>
            </div>

            {/* Webhooks List */}
            <div style={glassStyle}>
                {webhooks.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#444' }}>
                        <p style={{ fontSize: '12px', marginBottom: '15px' }}>No webhooks configured</p>
                        <button onClick={() => setShowAdd(true)} style={{ ...btnStyle, color: 'var(--accent)' }}>Add your first webhook</button>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-hover)' }}>
                                <th style={thStyle}>NAME</th>
                                <th style={thStyle}>EVENTS</th>
                                <th style={thStyle}>STATUS</th>
                                <th style={thStyle}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {webhooks.map(webhook => (
                                <tr key={webhook.id} style={{ borderBottom: '1px solid #1a1a1b' }}>
                                    <td style={tdStyle}>
                                        <strong>{webhook.name}</strong>
                                        <div style={{ fontSize: '9px', color: '#444', marginTop: '3px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {webhook.url.substring(0, 50)}...
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {webhook.events?.split(',').filter(e => e).map(event => (
                                                <span key={event} style={{ fontSize: '8px', background: '#1a1a1a', padding: '3px 6px', color: '#888' }}>
                                                    {event}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleToggle(webhook)}
                                            style={{
                                                background: webhook.enabled ? 'var(--accent)20' : '#22222240',
                                                color: webhook.enabled ? 'var(--accent)' : '#666',
                                                border: 'none',
                                                padding: '5px 12px',
                                                fontSize: '9px',
                                                cursor: 'pointer',
                                                fontWeight: '800'
                                            }}
                                        >
                                            {webhook.enabled ? 'ACTIVE' : 'DISABLED'}
                                        </button>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => testWebhook(webhook.url)} style={btnStyle}>TEST</button>
                                            <button onClick={() => openEdit(webhook)} style={btnStyle}>EDIT</button>
                                            <button onClick={() => handleDelete(webhook.id)} style={{ ...btnStyle, color: '#ff4444' }}>DELETE</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ... (Existing ContentView)


function HomeView() {
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
        { label: 'TOTAL_ARTISTS', value: stats.counts.artists, color: 'var(--accent)', icon: <Mic2 size={20} /> },
        { label: 'TOTAL_USERS', value: stats.counts.users, color: '#0088ff', icon: <Users size={20} /> },
        { label: 'TOTAL_ALBUMS', value: stats.counts.albums || 0, color: '#aa00ff', icon: <Disc size={20} /> },
        { label: 'TOTAL_SONGS', value: stats.counts.songs || 0, color: '#ff00aa', icon: <Mic2 size={20} /> },
        { label: 'PENDING_DEMOS', value: stats.counts.pendingDemos, color: '#ffaa00', icon: <FileAudio size={20} /> },
        { label: 'PENDING_REQUESTS', value: stats.counts.pendingRequests, color: '#ff4444', icon: <AlertCircle size={20} /> }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '0px' }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        style={{ ...glassStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '2px' }}>{card.label}</div>
                            <div style={{ color: card.color, opacity: 0.5 }}>{card.icon}</div>
                        </div>
                        <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', letterSpacing: '-0.04em' }}>{card.value}</div>
                        <div style={{ height: '2px', width: '20px', background: card.color }}></div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    style={glassStyle}
                >
                    <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: '900', color: '#fff' }}>RECENT_DEMOS</h3>
                        <RefreshCw size={14} color="#222" style={{ cursor: 'pointer' }} onClick={fetchStats} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {stats.recent.demos.map((demo, i) => (
                            <motion.div
                                key={demo.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + (i * 0.05) }}
                                style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em' }}>{demo.title}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>{demo.artist?.stageName || 'Unknown'}</div>
                                </div>
                                <div style={{ fontSize: '9px', padding: '6px 12px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)', color: '#444', fontWeight: '900', border: '1px solid rgba(255,255,255,0.05)', letterSpacing: '1px' }}>
                                    {new Date(demo.createdAt).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                        {stats.recent.demos.length === 0 && <div style={{ padding: '60px', textAlign: 'center', color: '#222', fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>NO_RECENT_ACTIVITY</div>}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    style={glassStyle}
                >
                    <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: '900', color: '#fff' }}>RECENT_REQUESTS</h3>
                        <RefreshCw size={14} color="#222" style={{ cursor: 'pointer' }} onClick={fetchStats} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {stats.recent.requests.map((req, i) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + (i * 0.05) }}
                                style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em' }}>{req.type.toUpperCase().replace('_', ' ')}</div>
                                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '1px' }}>{req.user?.stageName || 'Unknown'}</div>
                                </div>
                                <div
                                    style={{
                                        fontSize: '9px',
                                        padding: '6px 12px',
                                        borderRadius: '30px',
                                        background: req.status === 'pending' ? 'rgba(255,170,0,0.05)' : 'rgba(255,255,255,0.02)',
                                        color: req.status === 'pending' ? '#ffaa00' : '#444',
                                        fontWeight: '900',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {req.status.toUpperCase()}
                                </div>
                            </motion.div>
                        ))}
                        {stats.recent.requests.length === 0 && <div style={{ padding: '60px', textAlign: 'center', color: '#222', fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>NO_RECENT_ACTIVITY</div>}
                    </div>
                </motion.div>
            </div>
        </motion.div>
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
            case 'completed': return { bg: 'rgba(245, 197, 66, 0.18)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'approved': return { bg: 'rgba(245, 197, 66, 0.18)', border: 'var(--accent)', color: 'var(--accent)' };
            case 'processing': return { bg: 'rgba(0, 170, 255, 0.1)', border: '#00aaff', color: '#00aaff' };
            case 'reviewing': return { bg: 'rgba(255, 170, 0, 0.1)', border: '#ffaa00', color: '#ffaa00' };
            case 'needs_action': return { bg: 'rgba(255, 240, 0, 0.1)', border: '#fff000', color: '#fff000' };
            case 'rejected': return { bg: 'rgba(255, 68, 68, 0.1)', border: '#ff4444', color: '#ff4444' };
            default: return { bg: 'rgba(102, 102, 102, 0.1)', border: '#666', color: '#666' };
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
                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                            {selectedRequest.release?.image && (
                                <img src={selectedRequest.release.image?.startsWith('private/') ? `/api/files/release/${selectedRequest.release.id}` : selectedRequest.release.image} alt="Release" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            <div style={{ fontSize: '14px', background: '#222', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', border: '1px solid var(--border)' }}>
                                {selectedRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>DESCRIPTION & FILES</label>
                            <div style={{
                                background: 'var(--surface-hover)',
                                padding: '20px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
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
                                style={{ ...btnStyle, flex: 1, background: 'rgba(255, 170, 0, 0.1)', color: '#ffaa00', borderColor: '#ffaa0030' }}
                            >
                                REVIEWING
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedRequest.id, 'processing')}
                                disabled={processing === selectedRequest.id}
                                style={{ ...btnStyle, flex: 1, background: 'rgba(0, 170, 255, 0.1)', color: '#00aaff', borderColor: '#00aaff30' }}
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
                                style={{ ...btnStyle, flex: 1, color: '#ff4444', borderColor: '#ff444430' }}
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
                                    <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                        {req.release?.image && <img src={req.release.image?.startsWith('private/') ? `/api/files/release/${req.release.id}` : req.release.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
                                    fontSize: '9px', fontWeight: '900', borderRadius: '4px'
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
                    // System
                    defaultPlaylistId: parsed.defaultPlaylistId || '6QHy5LPKDRHDdKZGBFxRY8',
                    // Genres
                    genres: parsed.genres || ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other']
                });
            } else {
                // Defaults
                setConfig({
                    allowCoverArt: true, allowAudio: true, allowDelete: true, allowOther: true,
                    siteName: 'LOST MUSIC', registrationsOpen: true, maintenanceMode: false, adminEmail: '',
                    heroText: 'THE NEW ORDER', heroSubText: 'INDEPENDENT DISTRIBUTION REDEFINED.', featuredReleaseId: '',
                    featuredReleaseLabel: 'FEATURED RELEASE', featuredReleaseSubLabel: 'NOW STREAMING', featuredReleaseStatus: 'Featured',
                    showStats: true,
                    discord: '', instagram: '', spotify: '', youtube: '',
                    defaultPlaylistId: '6QHy5LPKDRHDdKZGBFxRY8',
                    genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other']
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
        { id: 'genres', label: 'GENRES' },
        { id: 'requests', label: 'REQUESTS' },
        { id: 'home', label: 'HOME PAGE' },
        { id: 'socials', label: 'SOCIALS' }
    ];

    const inputStyle = {
        width: '100%',
        padding: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: '#fff',
        borderRadius: '8px',
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
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff4444' }}>MAINTENANCE MODE</span>
                                <div onClick={() => toggle('maintenanceMode')} style={{ width: '40px', height: '20px', background: config.maintenanceMode ? '#ff4444' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.maintenanceMode ? '22px' : '2px', transition: 'left 0.3s' }} />
                                </div>
                            </div>
                        </div>
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
                                style={{ ...btnStyle, background: 'var(--accent)', color: '#000', padding: '12px 20px', border: 'none', borderRadius: '8px' }}
                            >
                                ADD
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {config.genres.map(g => (
                                <div key={g} style={{
                                    padding: '10px 15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800' }}>{g}</span>
                                    <button
                                        onClick={() => handleChange('genres', config.genres.filter(genre => genre !== g))}
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px' }}
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
                                style={{ ...inputStyle, background: '#0f1016' }}
                            >
                                <option value="">(Auto-pick latest)</option>
                                {releaseOptions.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} — {r.artistName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                                Anasayfa hero'da görünecek release. Seçilmezse en güncel release kullanılır.
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

                {/* SOCIALS SETTINGS */}
                {activeTab === 'socials' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {['discord', 'instagram', 'spotify', 'youtube'].map(social => (
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
        { key: 'commission_rules', label: 'Commission Rules / Komisyon Kuralları' }
    ];

    const handleEdit = (item) => {
        setEditing(item?.key || null);
        setEditTitle(item?.title || '');
        const contentStr = item?.content || '';
        setEditContent(contentStr);

        // Handle structured FAQ items
        if (item?.key === 'faq') {
            try {
                const parsed = contentStr ? JSON.parse(contentStr) : [];
                setFaqItems(Array.isArray(parsed) ? parsed : []);
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
            if (editing === 'faq') {
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
                                <h3 style={{ fontSize: '13px', fontWeight: '800' }}>{type.label}</h3>
                                {!isEditing && (
                                    <button onClick={() => handleEdit(item || { key: type.key })} style={{ ...btnStyle, color: 'var(--accent)' }}>
                                        {item ? 'EDIT' : 'CREATE'}
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Title"
                                        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: '#fff' }}
                                    />
                                    {editing === 'faq' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {faqItems.map((item, index) => (
                                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>QUESTION #{index + 1}</span>
                                                        <button onClick={() => removeFaqItem(index)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '10px' }}>REMOVE</button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.q}
                                                        onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                                                        placeholder="Question..."
                                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--border)', color: '#fff' }}
                                                    />
                                                    <textarea
                                                        value={item.a}
                                                        onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                                                        placeholder="Answer..."
                                                        rows={3}
                                                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--border)', color: '#888', resize: 'vertical' }}
                                                    />
                                                </div>
                                            ))}
                                            <button onClick={addFaqItem} style={{ ...btnStyle, alignSelf: 'flex-start' }}>+ ADD QUESTION</button>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="Content (can be JSON or plain text)"
                                            rows={8}
                                            style={{ width: '100%', padding: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: '#fff', resize: 'vertical' }}
                                        />
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button onClick={handleSave} disabled={saving} className="glow-button" style={{ padding: '8px 20px' }}>
                                            {saving ? 'SAVING...' : 'SAVE'}
                                        </button>
                                        <button onClick={() => setEditing(null)} style={{ ...btnStyle, padding: '8px 20px' }}>CANCEL</button>
                                    </div>
                                </div>
                            ) : item ? (
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    <p><strong>Title:</strong> {item.title}</p>
                                    <p style={{ marginTop: '10px' }}><strong>Updated:</strong> {new Date(item.updatedAt).toLocaleDateString()}</p>
                                </div>
                            ) : (
                                <p style={{ fontSize: '11px', color: '#444' }}>No content yet. Click CREATE to add.</p>
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
                style={{ ...inputStyle, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', width: '100%' }}
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
                    background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px',
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
                        style={{ padding: '10px', borderTop: '1px solid #222', color: '#ff4444', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}
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
                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
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
                                Don't see the artist? <button onClick={() => showToast('Please go to the Artists tab to create a new profile first.', "info")} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Create Profile</button>
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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

                            <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '10px', color: totalSplit !== 100 ? '#ff4444' : 'var(--accent)' }}>
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', minHeight: '60px' }}
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
                                    <span style={{ fontSize: '9px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontWeight: '900' }}>
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
                                    <button onClick={() => handleDeleteContract(c.id)} style={{ ...btnStyle, color: '#ff4444' }}>
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

function EarningsView({ earnings, onRefresh, contracts }) {
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

    const totalGross = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
    const totalArtist = earnings.reduce((sum, e) => sum + e.artistAmount, 0);
    const totalLabel = earnings.reduce((sum, e) => sum + e.labelAmount, 0);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
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

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid #fff' }}
                >
                    <div style={{ marginBottom: '15px', color: editingId ? 'var(--accent)' : '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '2px' }}>
                        {editingId ? 'EDITING EARNING RECORD' : 'NEW EARNING RECORD'}
                    </div>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>CONTRACT (RELEASE + ARTIST)</label>
                            <select
                                value={form.contractId}
                                onChange={e => setForm({ ...form, contractId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GROSS AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.grossAmount}
                                onChange={e => setForm({ ...form, grossAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AD SPEND / EXPENSES ($)</label>
                            <input
                                type="number" step="0.01"
                                value={form.expenseAmount}
                                onChange={e => setForm({ ...form, expenseAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STREAMS (OPTIONAL)</label>
                            <input
                                type="number"
                                value={form.streams}
                                onChange={e => setForm({ ...form, streams: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SOURCE</label>
                            <select
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                            <Trash2 size={14} color="#ff4444" />
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>METHOD</label>
                            <select
                                value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STATUS</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
                                        fontSize: '9px', padding: '4px 8px', borderRadius: '4px',
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
                                    <button onClick={() => handleDeletePayment(p.id)} style={{ ...btnStyle, color: '#ff4444' }}>
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
                    style={{ flex: 1, padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
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
