import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';
import { RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, glassStyle, inputStyle, tdStyle, thStyle } from './styles';

function UserLinker({ artistId, users, artistEmail }) {
    const { showToast } = useToast();
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
        } catch (e) {
            console.error(e);
            showToast('Error linking user', "error");
        }
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
                            style={{ ...btnStyle, background: 'var(--accent)', color: '#000', fontSize: '9px', padding: '5px 10px', height: 'auto' }}
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
                        <button onClick={() => handleLink()} disabled={linking} style={{ ...btnStyle, flex: 1, background: 'var(--accent)', color: '#000', justifyContent: 'center', height: 'auto' }}>
                            {linking ? 'LINKING...' : 'CONFIRM LINK'}
                        </button>
                        <button onClick={() => setSelectedUser(null)} style={{ ...btnStyle, flex: 1, justifyContent: 'center', height: 'auto' }}>CANCEL</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ArtistsView({ artists, users, onSync, onRefresh }) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const canManage = session?.user?.role === 'admin' || session?.user?.permissions?.canManageArtists;

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newArtist, setNewArtist] = useState({ name: '', spotifyUrl: '', email: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fix: Prevent spam clicking
    const [syncingArtistId, setSyncingArtistId] = useState(null);
    const [isSyncingAll, setIsSyncingAll] = useState(false);

    // Filter artists based on search
    const filteredArtists = useMemo(() => {
        return artists.filter(artist =>
            artist.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            artist.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [artists, debouncedSearch]);

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
        } catch (e) {
            console.error(e);
            showToast("Create error", "error");
        }
        finally { setSaving(false); }
    };

    if (selectedArtist) {
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
                        {selectedArtist.spotifyUrl && <a href={selectedArtist.spotifyUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '11px', textDecoration: 'none', display: 'block', marginTop: '5px' }}>OPEN SPOTIFY ↗</a>}
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
                                    style={{ ...btnStyle, marginTop: '15px', color: 'var(--status-error)', borderColor: '#ff444430', width: '100%', justifyContent: 'center', height: 'auto' }}
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
                                if (!confirm("Start bulk background sync? This will refresh all artists with Spotify URLs.")) return;
                                setIsSyncingAll(true);
                                try {
                                    const res = await fetch('/api/admin/scrape/batch', { method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                        showToast(`Batch Sync Completed. Success: ${data.successCount}, Failed: ${data.failCount}`, "success");
                                    } else {
                                        showToast("Batch sync failed", "error");
                                    }
                                    if (onRefresh) onRefresh();
                                } catch (e) { showToast("Sync error", "error"); }
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
                                cursor: isSyncingAll ? 'not-allowed' : 'pointer',
                                height: 'auto'
                            }}
                        >
                            <RefreshCw size={14} style={{ animation: isSyncingAll ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncingAll ? 'SYNCING...' : 'SYNC ALL'}
                        </button>
                        <button onClick={() => setIsCreating(true)} style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', height: 'auto' }}>
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
                        {filteredArtists.map((artist, i) => (
                            <motion.tr
                                key={artist.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                                onClick={() => setSelectedArtist(artist)}
                            >
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
                                            style={{ ...btnStyle, fontSize: '10px', padding: '5px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', height: 'auto' }}
                                        >
                                            <RefreshCw size={10} />
                                        </button>
                                        <button style={{ ...btnStyle, fontSize: '10px', padding: '5px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', height: 'auto' }}>MANAGE</button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
