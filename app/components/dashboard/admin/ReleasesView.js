import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Edit3, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { inputStyle } from './styles';

export default function ReleasesView({ releases }) {
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
                    const mainRelease = group.find(r => !r.versionName) || group[0];
                    const isExpanded = expandedReleaseId === mainRelease.baseTitle;
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
                                        {mainRelease.baseTitle || mainRelease.name}
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
                                                onClick={() => setExpandedReleaseId(isExpanded ? null : mainRelease.baseTitle)}
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
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#ddd' }}>
                                                            {v.versionName ? v.versionName.toUpperCase() : v.name}
                                                        </div>
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
