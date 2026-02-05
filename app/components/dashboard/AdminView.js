"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic2, Disc, FileAudio, AlertCircle, RefreshCw, Trash2, Edit3, CheckCircle, XCircle, Briefcase, DollarSign, CreditCard, Plus, HelpCircle } from 'lucide-react';

export default function AdminView() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'overview';

    const [submissions, setSubmissions] = useState([]);
    const [artists, setArtists] = useState([]);
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
        else if (view === 'artists') fetchArtists();
        else if (view === 'users') fetchUsers();
        else if (view === 'requests') fetchRequests();
        else if (view === 'content') fetchContent();
        else if (view === 'contracts') { fetchContracts(); fetchArtists(); fetchReleases(); }
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
            setArtists(Array.isArray(data) ? data : []);
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

    const handleSyncStats = async (userId, existingUrl) => {
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
                body: JSON.stringify({ userId, spotifyUrl })
            });
            const data = await res.json();
            if (data.success) {
                alert(`SUCCESS: ${data.monthlyListeners?.toLocaleString()} Monthly Listeners`);
                fetchArtists();
            } else {
                alert(data.error || "Sync failed");
            }
        } catch (e) { console.error(e); alert("Sync error"); }
        finally { setLoading(false); }
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
        if (!confirm('Delete this submission?')) return;
        try {
            await fetch(`/api/demo/${id}`, { method: 'DELETE' });
            fetchSubmissions();
        } catch (e) { console.error(e); }
    };

    const handleTestWebhook = async () => {
        try {
            const res = await fetch('/api/webhook/test', { method: 'POST' });
            const data = await res.json();
            alert(data.success ? "Webhook sent!" : "Webhook failed");
        } catch (e) { alert("Error testing webhook"); }
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
            {view === 'artists' && <ArtistsView artists={artists} onSync={handleSyncStats} />}
            {view === 'users' && <UsersView users={users} onRoleChange={handleRoleChange} onRefresh={fetchUsers} />}
            {view === 'requests' && <RequestsView requests={requests} onUpdateStatus={handleRequestStatusUpdate} />}
            {view === 'contracts' && <ContractsView contracts={contracts} artists={artists} releases={releases} onRefresh={fetchContracts} />}
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
    background: '#0a0a0a',
    border: '1px solid #333',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '8px',
    fontSize: '11px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};

function SubmissionsView({ demos, onStatusUpdate, onDelete }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#00ff88';
            case 'rejected': return '#ff4444';
            case 'reviewing': return '#ffaa00';
            default: return '#666';
        }
    };

    return (
        <div style={glassStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#111' }}>
                        <th style={thStyle}>DATE</th>
                        <th style={thStyle}>ARTIST</th>
                        <th style={thStyle}>TRACK / GENRE</th>
                        <th style={thStyle}>STATUS</th>
                        <th style={thStyle}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {demos.map(demo => (
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
                                        href={`/dashboard/demo/${demo.id}`} // UPDATED LINK TO NEW STRUCTURE
                                        style={{ ...btnStyle, color: '#fff', border: '1px solid #333', background: '#111', textDecoration: 'none' }}
                                    >
                                        REVIEW
                                    </Link>
                                    <button onClick={() => onDelete(demo.id)} style={{ ...btnStyle, color: '#444' }}>DELETE</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {demos.length === 0 && (
                        <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO SUBMISSIONS</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ArtistsView({ artists, onSync }) {
    const { data: session } = useSession();
    const canManage = session?.user?.role === 'admin' || session?.user?.permissions?.canManageArtists;

    // List View State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Filter artists based on search
    const filteredArtists = artists.filter(artist =>
        artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [artistData, setArtistData] = useState({ loading: false, demos: [], releases: [] });
    const [editingArtist, setEditingArtist] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', spotifyUrl: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedArtist) fetchArtistDetails(selectedArtist);
    }, [selectedArtist]);

    const fetchArtistDetails = async (artist) => {
        setArtistData(prev => ({ ...prev, loading: true }));
        try {
            const url = new URL('/api/admin/releases', window.location.origin);
            if (artist.type === 'roster') url.searchParams.set('artistId', artist.id);

            const [demosRes, releasesRes] = await Promise.all([
                fetch(`/api/demo?userId=${artist.type === 'registered' ? artist.id : ''}`),
                fetch(url)
            ]);
            const demos = await demosRes.json();
            const releases = await releasesRes.json();

            setArtistData({
                loading: false,
                demos: Array.isArray(demos) ? demos : [],
                releases: Array.isArray(releases) ? releases : []
            });
        } catch (e) {
            console.error(e);
            setArtistData(prev => ({ ...prev, loading: false }));
        }
    };

    const openEdit = (artist) => {
        setEditingArtist(artist);
        setEditForm({ name: artist.name, spotifyUrl: artist.spotifyUrl || '' });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/artists', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingArtist.id,
                    type: editingArtist.type,
                    name: editForm.name,
                    spotifyUrl: editForm.spotifyUrl
                })
            });
            if (res.ok) {
                setEditingArtist(null);
                window.location.reload();
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, type) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/admin/artists?id=${id}&type=${type}`, { method: 'DELETE' });
            if (res.ok) window.location.reload();
        } catch (e) { console.error(e); }
    };

    if (selectedArtist) {
        return (
            <div style={{ ...glassStyle, minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                {/* HEADER */}
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => setSelectedArtist(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>←</button>
                        <div>
                            <h3 style={{ fontSize: '16px', letterSpacing: '1px', margin: 0, fontWeight: '800' }}>{selectedArtist.name}</h3>
                            <div style={{ fontSize: '11px', color: '#666' }}>{selectedArtist.email}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => onSync(selectedArtist.id, selectedArtist.spotifyUrl)} style={{ ...btnStyle, fontSize: '11px' }}>
                            {selectedArtist.spotifyUrl ? 'SYNC SPOTIFY' : 'LINK SPOTIFY'}
                        </button>
                        <a href={selectedArtist.spotifyUrl} target="_blank" rel="noreferrer" style={{ ...btnStyle, fontSize: '11px', textDecoration: 'none', display: selectedArtist.spotifyUrl ? 'block' : 'none' }}>
                            OPEN SPOTIFY ↗
                        </a>
                    </div>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '15px 30px 0 30px' }}>
                    {['profile', 'demos', 'releases'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                color: activeTab === tab ? '#fff' : '#666',
                                padding: '15px 20px',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
                    {artistData.loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#444', fontSize: '12px' }}>LOADING DATA...</div>
                    ) : (
                        <>
                            {activeTab === 'profile' && (
                                <div style={{ maxWidth: '600px' }}>
                                    <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                                        <div style={{ width: '100px', height: '100px', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#444' }}>
                                            {selectedArtist.image ? <img src={selectedArtist.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                                        </div>
                                        <div>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '2px', fontWeight: '800' }}>FULL NAME / ID</label>
                                                <div style={{ fontSize: '14px' }}>{selectedArtist.fullName || selectedArtist.id}</div>
                                            </div>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '2px', fontWeight: '800' }}>STAGE NAME</label>
                                                <div style={{ fontSize: '14px' }}>{selectedArtist.stageName || selectedArtist.name}</div>
                                            </div>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '2px', fontWeight: '800' }}>MONTHLY LISTENERS</label>
                                                <div style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: '800' }}>
                                                    {selectedArtist.monthlyListeners ? selectedArtist.monthlyListeners.toLocaleString() : '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'demos' && (
                                <div>
                                    {artistData.demos.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '40px' }}>NO DEMOS SUBMITTED</div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #222' }}>
                                                    <th style={{ ...thStyle, padding: '10px' }}>DATE</th>
                                                    <th style={{ ...thStyle, padding: '10px' }}>TITLE</th>
                                                    <th style={{ ...thStyle, padding: '10px' }}>STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {artistData.demos.map(demo => (
                                                    <tr key={demo.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                                        <td style={{ ...tdStyle, padding: '10px' }}>{new Date(demo.createdAt).toLocaleDateString()}</td>
                                                        <td style={{ ...tdStyle, padding: '10px' }}>{demo.title}</td>
                                                        <td style={{ ...tdStyle, padding: '10px' }}>
                                                            <span style={{
                                                                color: demo.status === 'approved' ? '#00ff88' : demo.status === 'rejected' ? '#ff4444' : '#ffaa00',
                                                                fontSize: '10px', fontWeight: '800'
                                                            }}>
                                                                {demo.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {activeTab === 'releases' && (
                                <div>
                                    {artistData.releases.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '40px' }}>NO RELEASES FOUND</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                                            {/* UPCOMING */}
                                            {artistData.releases.some(r => new Date(r.releaseDate) > new Date()) && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>UPCOMING</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                                        {artistData.releases.filter(r => new Date(r.releaseDate) > new Date()).map(release => (
                                                            <div key={release.id} className="glass" style={{ padding: '15px', border: '1px solid rgba(0,255,136,0.1)' }}>
                                                                <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', marginBottom: '10px' }}>
                                                                    {release.image && <img src={release.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                                </div>
                                                                <div style={{ fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{release.name}</div>
                                                                <div style={{ fontSize: '10px', color: 'var(--accent)' }}>{new Date(release.releaseDate || release.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PAST */}
                                            <div>
                                                <h4 style={{ fontSize: '11px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>DISCOGRAPHY</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                                    {artistData.releases.filter(r => new Date(r.releaseDate) <= new Date()).map(release => (
                                                        <div key={release.id} className="glass" style={{ padding: '15px', border: '1px solid #222' }}>
                                                            <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', marginBottom: '10px' }}>
                                                                {release.image && <img src={release.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                            </div>
                                                            <div style={{ fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{release.name}</div>
                                                            <div style={{ fontSize: '10px', color: '#666' }}>{new Date(release.releaseDate || release.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // LIST VIEW (Existing functionality wrapped)
    return (
        <div>
            {/* Edit Modal */}
            {editingArtist && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="glass" style={{ padding: '30px', width: '400px', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '25px', letterSpacing: '2px' }}>EDIT ARTIST</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>ARTIST NAME</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff' }} />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>SPOTIFY URL</label>
                            <input type="url" value={editForm.spotifyUrl} onChange={(e) => setEditForm({ ...editForm, spotifyUrl: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} disabled={saving} className="glow-button" style={{ flex: 1, padding: '12px' }}>
                                {saving ? 'SAVING...' : 'SAVE'}
                            </button>
                            <button onClick={() => setEditingArtist(null)} style={{ flex: 1, padding: '12px', background: '#222', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search artists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, width: '100%', maxWidth: '300px', background: 'rgba(255,255,255,0.02)' }}
                />
            </div>

            <div className="glass" style={{ overflow: 'hidden', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#111' }}>
                            <th style={thStyle}>JOINED</th>
                            <th style={thStyle}>ARTIST</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>LISTENERS</th>
                            <th style={thStyle}>DEMOS</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArtists.map(artist => (
                            <tr key={artist.id} style={{ borderBottom: '1px solid #1a1a1b', cursor: 'pointer', background: selectedArtist?.id === artist.id ? '#1a1a1a' : 'transparent' }} onClick={() => setSelectedArtist(artist)}>
                                <td style={tdStyle}>{new Date(artist.createdAt).toLocaleDateString()}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '13px' }}>{artist.name}</div>
                                    <div style={{ fontSize: '11px', color: '#555' }}>{artist.email || '---'}</div>
                                </td>
                                <td style={tdStyle}>
                                    {artist.type === 'registered' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '10px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '4px 10px', borderRadius: '4px', letterSpacing: '1px', fontWeight: '800', textAlign: 'center' }}>
                                                REGISTERED
                                            </span>
                                            {artist.role && artist.role !== 'artist' && (
                                                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: '#666', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px', fontWeight: '900', textAlign: 'center' }}>
                                                    {artist.role.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', color: '#444', padding: '4px 10px', borderRadius: '4px', letterSpacing: '1px', fontWeight: '800' }}>
                                            ROSTER_ONLY
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: artist.monthlyListeners ? 'var(--accent)' : '#444', fontWeight: '800', fontSize: '13px' }}>
                                        {artist.monthlyListeners ? artist.monthlyListeners.toLocaleString() : '---'}
                                    </span>
                                </td>
                                <td style={tdStyle}>{artist.demosCount || 0}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedArtist(artist); }} style={{ ...btnStyle, marginRight: '5px' }}>VIEW</button>
                                        <button onClick={(e) => { e.stopPropagation(); onSync(artist.id, artist.spotifyUrl); }} style={{ ...btnStyle, color: '#fff', fontSize: '10px' }}>
                                            {artist.spotifyUrl ? 'REFRESH' : 'SYNC'}
                                        </button>
                                        {canManage && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(artist); }} style={{ ...btnStyle, fontSize: '10px' }}>EDIT</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(artist.id, artist.type); }} style={{ ...btnStyle, color: '#ff4444', fontSize: '10px' }}>DELETE</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredArtists.length === 0 && (
                            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO ARTISTS FOUND</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReleasesView({ releases }) {
    const [activeTab, setActiveTab] = useState('all'); // 'upcoming', 'all'
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReleases = releases.filter(r => {
        const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.artistName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'upcoming') {
            return matchesSearch && new Date(r.releaseDate) > new Date();
        }
        return matchesSearch;
    });

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
                {filteredReleases.map(release => (
                    <div key={release.id} style={{ ...glassStyle, padding: '20px' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', marginBottom: '15px', overflow: 'hidden' }}>
                            {release.image && <img src={release.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
                    </div>
                ))}

                {filteredReleases.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#444', fontSize: '11px', letterSpacing: '2px' }}>
                        NO RELEASES FOUND
                    </div>
                )}
            </div>
        </div>
    );
}

function UsersView({ users, onRoleChange, onRefresh }) {
    const roles = ['artist', 'a&r', 'admin'];
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

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
            permissions: perms
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    ...editForm,
                    permissions: JSON.stringify(editForm.permissions)
                })
            });
            setEditingUser(null);
            onRefresh();
        } catch (e) { console.error(e); alert('Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
            onRefresh();
        } catch (e) { console.error(e); alert('Delete failed'); }
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
                    <div className="glass" style={{ padding: '30px', width: '800px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>
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
                            <button onClick={handleSave} disabled={saving} className="glow-button" style={{ flex: 1, padding: '15px', fontWeight: '900' }}>
                                {saving ? 'SAVING_CHANGES...' : 'SAVE_PERMISSIONS'}
                            </button>
                            <button onClick={() => setEditingUser(null)} style={{ flex: 0.5, padding: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '10px' }}>
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass" style={{ overflow: 'hidden', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#111' }}>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>SPOTIFY URL</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #1a1a1b' }}>
                                <td style={tdStyle}>{user.email}</td>
                                <td style={tdStyle}>{user.stageName || user.fullName || '---'}</td>
                                <td style={tdStyle}>
                                    {user.spotifyUrl ? (
                                        <a href={user.spotifyUrl} target="_blank" style={{ color: 'var(--accent)', fontSize: '10px' }}>VIEW</a>
                                    ) : <span style={{ color: '#444' }}>---</span>}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: user.role === 'admin' ? 'var(--accent)' : '#888' }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => openEdit(user)} style={btnStyle}>EDIT</button>
                                        <button onClick={() => handleDelete(user.id)} style={{ ...btnStyle, color: '#ff4444' }}>DELETE</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#444', padding: '50px' }}>NO USERS</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function WebhooksView({ webhooks, onRefresh, onTest }) {
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
            onRefresh();
        } catch (e) { console.error(e); alert('Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this webhook?')) return;
        try {
            await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' });
            onRefresh();
        } catch (e) { console.error(e); }
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
            alert('Test sent!');
        } catch (e) { alert('Test failed'); }
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
                    <div className="glass" style={{ padding: '30px', width: '450px', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '25px', letterSpacing: '2px' }}>
                            {editingWebhook ? 'EDIT WEBHOOK' : 'ADD WEBHOOK'}
                        </h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>NAME</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., New Release Alerts"
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: '800' }}>WEBHOOK URL</label>
                            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                                placeholder="https://discord.com/api/webhooks/..."
                                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff' }} />
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
                                                border: '1px solid #333',
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
                            <tr style={{ background: '#111' }}>
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
                                                background: webhook.enabled ? '#00ff8820' : '#22222240',
                                                color: webhook.enabled ? '#00ff88' : '#666',
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
        { label: 'TOTAL_ARTISTS', value: stats.counts.artists, color: '#00ff88', icon: <Mic2 size={20} /> },
        { label: 'TOTAL_USERS', value: stats.counts.users, color: '#0088ff', icon: <Users size={20} /> },
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

        if (!confirm(`Are you sure you want to ${statusVerb.toUpperCase()} this request?`)) return;
        setProcessing(id);
        await onUpdateStatus(id, status, adminNote, extra.assignedToId);
        setProcessing(null);
        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest(prev => ({ ...prev, status, adminNote, ...extra }));
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return { bg: 'rgba(0, 255, 136, 0.1)', border: '#00ff88', color: '#00ff88' };
            case 'approved': return { bg: 'rgba(0, 255, 136, 0.1)', border: '#00ff88', color: '#00ff88' };
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
                        <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                            {selectedRequest.release?.image && (
                                <img src={selectedRequest.release.image} alt="Release" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            <div style={{ fontSize: '14px', background: '#222', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', border: '1px solid #333' }}>
                                {selectedRequest.type.toUpperCase().replace('_', ' ')} CHANGE
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', color: '#666', display: 'block', marginBottom: '10px', fontWeight: '800' }}>DESCRIPTION & FILES</label>
                            <div style={{
                                background: '#111',
                                padding: '20px',
                                border: '1px solid #333',
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
                                style={{ ...btnStyle, flex: 1, background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', borderColor: '#00ff8830' }}
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
                                    <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                                        {req.release?.image && <img src={req.release.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
    const [config, setConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
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
                    heroText: 'THE NEW ORDER', heroSubText: 'INDEPENDENT DISTRIBUTION REDEFINED.', showStats: true,
                    discord: '', instagram: '', spotify: '', youtube: '',
                    defaultPlaylistId: '6QHy5LPKDRHDdKZGBFxRY8',
                    genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other']
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            });
            alert('Settings saved!');
        } catch (e) { alert('Failed to save'); }
        finally { setSaving(false); }
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
        background: '#0a0a0a',
        border: '1px solid #333',
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
                            <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#0a0a0a', border: '1px solid #1a1a1b' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#0a0a0a', border: '1px solid #1a1a1b' }}>
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
    const [editing, setEditing] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    const contentTypes = [
        { key: 'faq', label: 'FAQ / Sıkça Sorulan Sorular' },
        { key: 'commission_rules', label: 'Commission Rules / Komisyon Kuralları' }
    ];

    const handleEdit = (item) => {
        setEditing(item?.key || null);
        setEditTitle(item?.title || '');
        setEditContent(item?.content || '');
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: editing, title: editTitle, content: editContent })
            });
            setEditing(null);
            onRefresh();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
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
                                        style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }}
                                    />
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder="Content (can be JSON or plain text)"
                                        rows={8}
                                        style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', resize: 'vertical' }}
                                    />
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

function ContractsView({ contracts, onRefresh, artists, releases }) {
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        userId: '',
        releaseId: '',
        artistShare: 0.70,
        labelShare: 0.30,
        notes: '',
        pdfUrl: ''
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
            } else {
                alert(data.error || "Upload failed");
            }
        } catch (e) { alert("Error uploading PDF"); }
        finally { setUploadingPdf(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                onRefresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create contract");
            }
        } catch (e) { alert("Error creating contract"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this contract? All linked earnings will be lost.")) return;
        try {
            await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
            onRefresh();
        } catch (e) { alert("Delete failed"); }
    };

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowAdd(!showAdd)}
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
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST (USER)</label>
                            <select
                                value={form.userId}
                                onChange={e => setForm({ ...form, userId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="">Select Artist...</option>
                                {artists.filter(a => a.type === 'registered').map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE (SPOTIFY)</label>
                            <select
                                value={form.releaseId}
                                onChange={e => setForm({ ...form, releaseId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="">Select Release...</option>
                                {releases.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} - {r.artistName}</option>
                                ))}
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
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>LABEL SHARE (Calculated)</label>
                            <input
                                type="number" readOnly
                                value={form.labelShare.toFixed(2)}
                                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #222', color: '#444', borderRadius: '8px' }}
                            />
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
                                    style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid #333' }}
                                >
                                    {uploadingPdf ? 'UPLOADING...' : form.pdfUrl ? 'REPLACE PDF' : 'SELECT PDF'}
                                </button>
                                {form.pdfUrl && (
                                    <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: '800' }}>
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
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', minHeight: '60px' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                                {saving ? 'CREATING...' : 'CREATE CONTRACT'}
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
                                    <div style={{ fontWeight: '800', color: '#fff' }}>{c.release?.name}</div>
                                    <div style={{ fontSize: '9px', color: '#444' }}>{c.releaseId}</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: '800' }}>{c.user?.stageName || c.user?.fullName}</div>
                                    <div style={{ fontSize: '10px', color: '#555' }}>{c.user?.email}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: '#00ff88' }}>{Math.round(c.artistShare * 100)}%</span> / <span>{Math.round(c.labelShare * 100)}%</span>
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
                                        <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '5px 10px', fontSize: '8px' }}>
                                            VIEW PDF
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: '8px', color: '#333' }}>MISSING</span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleDelete(c.id)} style={{ ...btnStyle, color: '#ff4444' }}>
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
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        contractId: '',
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        grossAmount: '',
        streams: '',
        source: 'spotify'
    });

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/earnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                onRefresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to add earning");
            }
        } catch (e) { alert("Error adding earning"); }
        finally { setSaving(false); }
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
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#00ff88' }}>${totalArtist.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '2px', marginBottom: '5px' }}>LABEL EARNINGS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent)' }}>${totalLabel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> ADD MANUAL EARNING
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid #fff' }}
                >
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>CONTRACT (RELEASE + ARTIST)</label>
                            <select
                                value={form.contractId}
                                onChange={e => setForm({ ...form, contractId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="">Select Contract...</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.release?.name} - {c.user?.stageName || c.user?.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>PERIOD (YYYY-MM)</label>
                            <input
                                type="month"
                                value={form.period}
                                onChange={e => setForm({ ...form, period: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>GROSS AMOUNT ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={form.grossAmount}
                                onChange={e => setForm({ ...form, grossAmount: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STREAMS (OPTIONAL)</label>
                            <input
                                type="number"
                                value={form.streams}
                                onChange={e => setForm({ ...form, streams: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SOURCE</label>
                            <select
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="spotify">Spotify</option>
                                <option value="apple">Apple Music</option>
                                <option value="youtube">YouTube</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                                {saving ? 'ADDING...' : 'ADD RECORD'}
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
                            <th style={thStyle}>ARTIST PAY</th>
                            <th style={thStyle}>STREAMS</th>
                            <th style={thStyle}>SOURCE</th>
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
                                <td style={tdStyle}>
                                    <div style={{ color: '#00ff88', fontWeight: '800' }}>${e.artistAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style={{ fontSize: '8px', color: '#444' }}>({Math.round(e.contract?.artistShare * 100)}%)</div>
                                </td>
                                <td style={tdStyle}>{e.streams?.toLocaleString() || '---'}</td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666' }}>{e.source}</span>
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
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        userId: '',
        amount: '',
        method: 'bank_transfer',
        reference: '',
        notes: '',
        status: 'completed'
    });

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                onRefresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to record payment");
            }
        } catch (e) { alert("Error recording payment"); }
        finally { setSaving(false); }
    };

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={{ ...btnStyle, background: '#00ff88', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> RECORD PAYMENT
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid #00ff88' }}
                >
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST / USER</label>
                            <select
                                value={form.userId}
                                onChange={e => setForm({ ...form, userId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="">Select Recipient...</option>
                                {users.filter(u => u.role === 'artist' || u.role === 'a&r').map(u => (
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
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>METHOD</label>
                            <select
                                value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
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
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>STATUS</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                            >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                            <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#00ff88', color: '#000' }}>
                                {saving ? 'RECORDING...' : 'RECORD PAYMENT'}
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
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#00ff88' }}>${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                                        background: p.status === 'completed' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: p.status === 'completed' ? '#00ff88' : '#888',
                                        fontWeight: '900'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO PAYMENTS RECORDED</td></tr>
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
                    style={{ flex: 1, padding: '12px 20px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', borderRadius: '8px' }}
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

