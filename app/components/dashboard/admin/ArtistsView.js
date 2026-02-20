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
        <div style={{ marginTop: '16px', background: 'var(--glass)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', fontWeight: '950', color: '#888', marginBottom: '20px', letterSpacing: '2px' }}>LINK EXISTING USER</div>

            {suggestedUser && !selectedUser && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--accent-50)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '950', marginBottom: '4px', letterSpacing: '1px' }}>SUGGESTED MATCH</div>
                            <div style={{ fontSize: '12px', color: '#fff', fontWeight: '800' }}>{suggestedUser.email}</div>
                        </div>
                        <button
                            onClick={() => handleLink(suggestedUser)}
                            disabled={linking}
                            style={{ ...btnStyle, background: 'var(--accent)', color: '#000', fontSize: '11px', padding: '8px 16px', height: 'auto', border: 'none', borderRadius: '6px', fontWeight: '950' }}
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
                        style={{ ...inputStyle, marginBottom: '12px', width: '100%', padding: '12px 16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '6px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {searchTerm && filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={() => setSelectedUser(u)}
                                style={{ padding: '12px 16px', background: 'var(--glass)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            >
                                <span style={{ color: '#fff', fontWeight: '800' }}>{u.stageName || 'NO STAGE NAME'} <span style={{ color: '#666', fontSize: '10px', fontWeight: 'normal' }}>// {u.email}</span></span>
                                <span style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: '950', letterSpacing: '1px' }}>SELECT</span>
                            </div>
                        ))}
                        {searchTerm && filteredUsers.length === 0 && (
                            <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', padding: '8px', textAlign: 'center' }}>No users found matching search</div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '20px', fontSize: '12px', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                        LINK USER ACCOUNT:<br /><span style={{ color: 'var(--accent)', fontSize: '14px' }}>{selectedUser.email.toUpperCase()}</span>?
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleLink()} disabled={linking} style={{ ...btnStyle, flex: 2, background: '#fff', color: '#000', justifyContent: 'center', height: 'auto', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px' }}>
                            {linking ? 'LINKING...' : 'CONFIRM LINK'}
                        </button>
                        <button onClick={() => setSelectedUser(null)} style={{ ...btnStyle, flex: 1, justifyContent: 'center', height: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px' }}>CANCEL</button>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...glassStyle, padding: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <button onClick={() => setSelectedArtist(null)} style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>← BACK TO LIST</button>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                        {selectedArtist.image ? <NextImage src={selectedArtist.image} alt={selectedArtist.name} width={120} height={120} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px', opacity: 0.5 }}>👤</span>}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '950', letterSpacing: '-1px', color: '#fff' }}>{selectedArtist.name}</h2>
                        <div style={{ color: '#888', fontSize: '13px', marginTop: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>{selectedArtist.email || 'NO EMAIL LINKED'}</div>
                        {selectedArtist.spotifyUrl && <a href={selectedArtist.spotifyUrl} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontWeight: '950', letterSpacing: '1px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', width: 'fit-content', border: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>OPEN SPOTIFY PROFILE ↗</a>}
                    </div>

                    <div style={{ textAlign: 'right', background: 'var(--glass)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>MONTHLY LISTENERS</div>
                        <div style={{ fontSize: '32px', fontWeight: '950', color: (selectedArtist.monthlyListeners !== undefined && selectedArtist.monthlyListeners !== null) ? '#fff' : '#ff0000', letterSpacing: '-1px', marginBottom: '16px' }}>
                            {(selectedArtist.monthlyListeners !== undefined && selectedArtist.monthlyListeners !== null) ? selectedArtist.monthlyListeners.toLocaleString() : (
                                <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '950', color: '#ff4444' }}>
                                    <AlertCircle size={16} /> SYNC REQUIRED
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
                            style={{
                                ...btnStyle,
                                padding: '12px 24px',
                                fontSize: '11px',
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '950',
                                letterSpacing: '1px',
                                opacity: syncingArtistId === selectedArtist.id ? 0.7 : 1,
                                cursor: syncingArtistId === selectedArtist.id ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <RefreshCw size={14} style={{ animation: syncingArtistId === selectedArtist.id ? 'spin 1s linear infinite' : 'none' }} />
                            {syncingArtistId === selectedArtist.id ? 'REFRESHING...' : 'SYNC PLATFORM DATA'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ padding: '30px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '12px', color: '#888', fontWeight: '950', marginBottom: '24px', letterSpacing: '1px' }}>LINKED SYSTEM ACCOUNT</h3>
                        {selectedArtist.user ? (
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>{selectedArtist.user.stageName || selectedArtist.user.fullName || 'NO NAME'}</div>
                                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '6px', fontWeight: '800' }}>{selectedArtist.user.email}</div>
                                <div style={{ marginTop: '20px', fontSize: '10px', color: '#fff', background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>✓ ACCOUNT VERIFIED</div>
                                <div style={{ marginTop: '30px' }}>
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
                                        style={{ ...btnStyle, color: '#ff4444', borderColor: 'rgba(255,68,68,0.2)', background: 'rgba(255,68,68,0.05)', width: '100%', justifyContent: 'center', height: 'auto', padding: '14px', borderRadius: '8px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px' }}
                                    >
                                        UNLINK ACCOUNT
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <UserLinker artistId={selectedArtist.id} users={users} artistEmail={selectedArtist.email} />
                        )}
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <input
                        type="text"
                        placeholder="Search artists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, width: '100%', background: 'var(--glass)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                    />
                </div>
                {canManage && (
                    <div style={{ display: 'flex', gap: '12px' }}>
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
                                border: '1px solid var(--border)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isSyncingAll ? 0.7 : 1,
                                cursor: isSyncingAll ? 'not-allowed' : 'pointer',
                                height: 'auto',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '950',
                                letterSpacing: '1px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <RefreshCw size={14} style={{ animation: isSyncingAll ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncingAll ? 'SYNCING...' : 'SYNC ALL'}
                        </button>
                        <button onClick={() => setIsCreating(true)} style={{ ...btnStyle, background: '#fff', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', height: 'auto', padding: '10px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px' }}>
                            <Plus size={14} /> NEW ARTIST
                        </button>
                    </div>
                )}
            </div>

            {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                            width: '450px',
                            padding: '40px',
                            background: 'var(--surface)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: '32px', height: '2px', background: 'var(--accent)' }}></div>
                            <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', margin: 0 }}>NEW ARTIST PROFILE</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
                            <div>
                                <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>ARTIST NAME *</label>
                                <input
                                    placeholder="e.g. Lost Boy"
                                    value={newArtist.name}
                                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>EMAIL ADDRESS</label>
                                <input
                                    placeholder="contact@artist.com"
                                    value={newArtist.email}
                                    onChange={(e) => setNewArtist({ ...newArtist, email: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>SPOTIFY URL</label>
                                <input
                                    placeholder="https://open.spotify.com/artist/..."
                                    value={newArtist.spotifyUrl}
                                    onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', position: 'relative', zIndex: 1 }}>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                style={{ ...btnStyle, flex: 2, padding: '16px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', height: 'auto', justifyContent: 'center', fontSize: '11px', fontWeight: '950', letterSpacing: '1px' }}
                            >
                                {saving ? 'INITIALIZING...' : 'CREATE PLATFORM PROFILE'}
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                style={{ ...btnStyle, flex: 1, justifyContent: 'center', height: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: '950', letterSpacing: '1px', padding: '16px' }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>ARTIST</div>
                    <div>MONTHLY</div>
                    <div>STATUS</div>
                    <div>LINKED USER</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredArtists.map((artist, idx) => (
                        <motion.div
                            key={artist.id}
                            onClick={() => setSelectedArtist(artist)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr',
                                padding: '20px 24px',
                                borderBottom: idx === filteredArtists.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer',
                                gap: '15px'
                            }}
                        >
                            <div style={{ fontWeight: '950', color: '#fff', fontSize: '13px', letterSpacing: '0.5px' }}>{artist.name}</div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '12px', fontWeight: '950', color: 'var(--accent)' }}>
                                    {(artist.monthlyListeners !== null && artist.monthlyListeners !== undefined) ? artist.monthlyListeners.toLocaleString() : '---'}
                                </div>
                                <div style={{ fontSize: '9px', color: '#666', fontWeight: '800', marginTop: '4px', letterSpacing: '1px' }}>
                                    {artist.lastSyncedAt ? new Date(artist.lastSyncedAt).toLocaleDateString() : 'NEVER SYNCED'}
                                </div>
                            </div>

                            <div>
                                <span style={{
                                    fontSize: '9px',
                                    color: 'var(--accent)',
                                    background: 'rgba(245, 197, 66, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(245, 197, 66, 0.2)',
                                    fontWeight: '950',
                                    letterSpacing: '1px',
                                    display: 'inline-block'
                                }}>
                                    ACTIVE
                                </span>
                            </div>

                            <div>
                                {artist.user ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: '950', background: 'var(--accent-10)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                                            {artist.user.email}
                                        </span>
                                        <span style={{ color: '#888', fontSize: '9px', marginTop: '6px', fontWeight: '900', letterSpacing: '0.5px' }}>VERIFIED ACCOUNT</span>
                                    </div>
                                ) : (
                                    <span style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>UNLINKED</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSync(artist.userId, artist.spotifyUrl, artist.id);
                                    }}
                                    style={{ ...btnStyle, fontSize: '9px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    title="Sync Data"
                                >
                                    <RefreshCw size={10} /> SYNC
                                </button>
                                <button style={{ ...btnStyle, fontSize: '9px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>
                                    MANAGE
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredArtists.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                            NO ARTISTS FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
