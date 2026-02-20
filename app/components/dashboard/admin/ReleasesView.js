import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Edit3, Trash2, Edit2, Search } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, inputStyle } from './styles';

export default function ReleasesView({ releases }) {
    const actionBtnStyle = (typeof btnStyle !== 'undefined' && btnStyle)
        ? btnStyle
        : {
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            color: '#fff',
            padding: '8px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '900',
            letterSpacing: '1px',
            borderRadius: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        };
    const [activeTab, setActiveTab] = useState('all'); // 'upcoming', 'all', 'released'
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [editingRelease, setEditingRelease] = useState(null);
    const [saving, setSaving] = useState(false);
    const [expandedReleaseId, setExpandedReleaseId] = useState(null);
    const { showToast, showConfirm } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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

    const filteredReleases = useMemo(() => {
        return releases.filter(r => {
            const matchesSearch = r.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.artistName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.baseTitle?.toLowerCase().includes(debouncedSearch.toLowerCase());

            const releaseDate = new Date(r.releaseDate);
            const now = new Date();

            if (activeTab === 'upcoming') {
                return matchesSearch && releaseDate > now;
            } else if (activeTab === 'released') {
                return matchesSearch && releaseDate <= now;
            }
            return matchesSearch;
        }).sort((a, b) => {
            const popA = a.popularity || 0;
            const popB = b.popularity || 0;
            if (popA !== popB) return popB - popA;
            return new Date(b.releaseDate) - new Date(a.releaseDate);
        });
    }, [releases, debouncedSearch, activeTab]);

    const groupedReleases = useMemo(() => {
        const groups = {};
        filteredReleases.forEach(release => {
            const base = release.baseTitle || release.name;
            if (!groups[base]) groups[base] = [];
            groups[base].push(release);
        });
        return groups;
    }, [filteredReleases]);

    const sortedGroups = Object.values(groupedReleases).sort((groupA, groupB) => {
        const latestA = groupA.reduce((max, r) => new Date(r.releaseDate) > new Date(max.releaseDate) ? r : max, groupA[0]);
        const latestB = groupB.reduce((max, r) => new Date(r.releaseDate) > new Date(max.releaseDate) ? r : max, groupB[0]);
        return new Date(latestB.releaseDate) - new Date(latestA.releaseDate);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {['all', 'upcoming', 'released'].map(tab => (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: activeTab === tab ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: '1px solid',
                                borderColor: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeTab === tab ? '#fff' : '#666',
                                padding: '8px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab ? '950' : '900',
                                fontSize: '10px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicatorReleases"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'var(--glass)',
                                        borderRadius: '6px',
                                        zIndex: 0
                                    }}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span style={{ position: 'relative', zIndex: 1 }}>{tab}</span>
                        </motion.button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="SEARCH RELEASES..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            ...inputStyle,
                            width: '320px',
                            paddingLeft: '40px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '10px',
                            letterSpacing: '1px',
                            fontWeight: '800'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {sortedGroups.map((group, idx) => {
                    const mainRelease = group.find(r => !r.versionName) || group[0];
                    const isExpanded = expandedReleaseId === mainRelease.baseTitle;
                    const variants = group.filter(r => r.id !== mainRelease.id);
                    const isReleased = new Date(mainRelease.releaseDate) <= new Date();

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -2 }}
                            key={mainRelease.id} style={{
                                padding: '0', display: 'flex', flexDirection: 'column',
                                borderRadius: '12px', background: 'var(--surface)',
                                position: 'relative', overflow: 'hidden',
                                border: '1px solid var(--border)'
                            }}>
                            {/* Main Card */}
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                    {mainRelease.image ? (
                                        <NextImage src={mainRelease.image?.startsWith('private/') ? `/api/files/release/${mainRelease.id}` : (mainRelease.image || '/default-album.jpg')} alt={mainRelease.name} width={240} height={240} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Disc size={40} color="#222" />
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        padding: '4px 10px', borderRadius: '4px',
                                        background: isReleased ? 'rgba(255,255,255,0.1)' : 'rgba(57,255,20,0.1)',
                                        backdropFilter: 'blur(8px)', border: `1px solid ${isReleased ? 'rgba(255,255,255,0.2)' : 'rgba(57,255,20,0.2)'}`,
                                        color: isReleased ? '#fff' : 'var(--accent)', fontSize: '9px', fontWeight: '950', letterSpacing: '1.5px'
                                    }}>
                                        {isReleased ? 'RELEASED' : 'UPCOMING'}
                                    </div>
                                    {/* Action Buttons Overlay on Image */}
                                    <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', gap: '8px', padding: '16px', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingRelease(mainRelease); }}
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}
                                        >
                                            <Edit3 size={12} /> EDIT
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(mainRelease.id); }}
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#ff4444', fontSize: '9px', fontWeight: '950', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}
                                        >
                                            <Trash2 size={12} /> DELETE
                                        </button>
                                    </motion.div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#fff', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.5px' }}>
                                        {mainRelease.baseTitle || mainRelease.name}
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '900', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                        {mainRelease.artistName || 'Unknown Artist'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '10px', color: '#666', fontWeight: '800', letterSpacing: '1px' }}>
                                            {new Date(mainRelease.releaseDate || mainRelease.createdAt).toLocaleDateString()}
                                        </p>
                                        {variants.length > 0 && (
                                            <button
                                                onClick={() => setExpandedReleaseId(isExpanded ? null : mainRelease.baseTitle)}
                                                style={{ background: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: '950', cursor: 'pointer', letterSpacing: '1px' }}
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
                                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
                                    >
                                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {variants.map(v => (
                                                <div key={v.id} style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#ddd', letterSpacing: '0.5px' }}>
                                                            {v.versionName ? v.versionName.toUpperCase() : v.name}
                                                        </div>
                                                        <div style={{ fontSize: '9px', color: '#666', fontWeight: '800', marginTop: '2px' }}>{new Date(v.releaseDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingRelease(v); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '4px' }} title="Edit"><Edit2 size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', color: '#ff4444', cursor: 'pointer', padding: '6px', borderRadius: '4px' }} title="Delete"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
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
                            <h3 style={{ fontSize: '14px', letterSpacing: '3px', fontWeight: '950', color: '#fff', margin: 0 }}>EDIT RELEASE DATA</h3>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>RELEASE TITLE</label>
                                    <input
                                        value={editingRelease.name || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, name: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>ARTIST NAME</label>
                                    <input
                                        value={editingRelease.artistName || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, artistName: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>RELEASE DATE</label>
                                    <input
                                        type="date"
                                        value={new Date(editingRelease.releaseDate).toISOString().split('T')[0]}
                                        onChange={e => setEditingRelease({ ...editingRelease, releaseDate: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>TOTAL STREAMS</label>
                                    <input
                                        value={editingRelease.streamCountText || ''}
                                        onChange={e => setEditingRelease({ ...editingRelease, streamCountText: e.target.value })}
                                        style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        placeholder="e.g. 1.2M"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '10px', color: '#888', fontWeight: '900', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>POPULARITY (0-100)</label>
                                <input
                                    type="number"
                                    value={editingRelease.popularity || 0}
                                    onChange={e => setEditingRelease({ ...editingRelease, popularity: parseInt(e.target.value) })}
                                    style={{ ...inputStyle, width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                                <button type="submit" disabled={saving} style={{ ...actionBtnStyle, flex: 2, padding: '16px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', height: 'auto', fontSize: '11px', fontWeight: '950', letterSpacing: '1px', display: 'flex', justifyContent: 'center' }}>
                                    {saving ? 'UPDATING...' : 'SAVE CHANGES'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingRelease(null)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '950',
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        padding: '16px'
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
