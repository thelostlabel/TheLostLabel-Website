import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, tdStyle, thStyle, glassStyle, inputStyle } from './styles';

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

    const filteredArtists = useMemo(() => {
        return artists.filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.user?.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [artists, searchTerm]);

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

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 40px', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input
                placeholder="Name (e.g. LXGHTLXSS)"
                value={split.name}
                onChange={e => {
                    const newName = e.target.value;
                    const match = artists.find(a => a.name.toLowerCase() === newName.toLowerCase());
                    const update = { ...split, name: newName };

                    if (match) {
                        update.artistId = match.id;
                        update.userId = match.userId || '';
                    }

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

export default function ContractsView({ contracts, onRefresh, artists, releases, demos = [] }) {
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
            const url = '/api/contracts';
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
                                        userId: artist.userId || '',
                                        primaryArtistName: artist.name
                                    };

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
                                value={form.releaseId || form.demoId || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    const release = releases.find(r => r.id === val);
                                    const demo = demos.find(d => d.id === val);

                                    let newSplits = [...form.splits];
                                    let update = { ...form };

                                    if (release) {
                                        update.releaseId = release.id;
                                        update.demoId = '';
                                        update.title = '';

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
                                                    if (artists[0]) update.primaryArtistName = artists[0].name;
                                                }
                                            } catch (e) { console.error("Parse splits error", e); }
                                        }
                                    } else if (demo) {
                                        update.releaseId = '';
                                        update.demoId = demo.id;
                                        update.title = demo.title;
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
                            <tr><td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '50px' }}>NO CONTRACTS DEFINED</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
