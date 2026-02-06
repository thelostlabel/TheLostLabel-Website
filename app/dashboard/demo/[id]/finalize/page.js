"use client";
import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, Upload, Info, CheckCircle, Music, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';

const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(40px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    overflow: 'hidden'
};

const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const btnStyle = {
    padding: '15px 30px',
    fontSize: '11px',
    fontWeight: '900',
    letterSpacing: '2px',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
};

export default function FinalizeReleasePage({ params }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const [demo, setDemo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState(1);

    // Artist Selection State
    const [artists, setArtists] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArtistDropdown, setShowArtistDropdown] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState(null);

    const [finalizeData, setFinalizeData] = useState({
        releaseName: '',
        releaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        artistShare: '0.70',
        labelShare: '0.30',
        notes: '',
        splits: [],
        contractPdf: null,
        artistId: null,
        featuredArtists: [] // Added for multiple artists support
    });

    useEffect(() => {
        fetchDemo();
        fetchArtists();
    }, [id]);

    const fetchDemo = async () => {
        try {
            const res = await fetch(`/api/demo/${id}`);
            const data = await res.json();
            if (data) {
                setDemo(data);
                setFinalizeData(prev => ({
                    ...prev,
                    releaseName: data.title,
                }));
                // Set initial artist from demo
                if (data.artist?.artist) {
                    setSelectedArtist(data.artist.artist);
                    setFinalizeData(prev => ({ ...prev, artistId: data.artist.artist.id }));
                } else {
                    // Fallback to creating a virtual artist object from user if no profile exists
                    setSelectedArtist({
                        id: 'USER_LINKED',
                        name: data.artist.stageName || data.artist.fullName,
                        email: data.artist.email,
                        userId: data.artist.id
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchArtists = async () => {
        try {
            const res = await fetch('/api/admin/artists');
            const data = await res.json();
            if (res.ok) setArtists(data.artists || []);
        } catch (e) { console.error("Error fetching artists", e); }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d' }}>
            <motion.p
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ color: '#444', fontSize: '10px', letterSpacing: '4px', fontWeight: '900' }}
            >
                SYNCING_PROJECT_DATA...
            </motion.p>
        </div>
    );

    if (!demo) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d' }}>
            <div style={{ textAlign: 'center', ...glassStyle, padding: '40px' }}>
                <Info size={32} style={{ color: '#ff4444', marginBottom: '20px', opacity: 0.5 }} />
                <h2 style={{ color: '#fff', fontSize: '14px', letterSpacing: '2px', fontWeight: '900', marginBottom: '10px' }}>PROJECT_NOT_FOUND</h2>
                <Link href="/dashboard" style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textDecoration: 'none' }}>RETURN TO COMMAND CENTER</Link>
            </div>
        </div>
    );

    const handleFinalize = async () => {
        setProcessing(true);
        try {
            let finalizedArtistId = finalizeData.artistId;

            // NEW: If it's a new artist, create the profile first
            if (selectedArtist?.isNew) {
                const createArtistRes = await fetch('/api/admin/artists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: selectedArtist.name,
                        email: demo.artist?.email || session?.user?.email, // Default to current user email
                        userId: demo.artist?.userId || null
                    })
                });
                if (createArtistRes.ok) {
                    const newArtist = await createArtistRes.json();
                    finalizedArtistId = newArtist.id;
                } else {
                    const err = await createArtistRes.json();
                    throw new Error(err.error || "Failed to create new artist profile");
                }
            }

            let pdfPath = null;
            if (finalizeData.contractPdf) {
                const formData = new FormData();
                formData.append('files', finalizeData.contractPdf);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (uploadRes.ok) pdfPath = (await uploadRes.json()).filepath;
            }

            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'approved',
                    finalizeData: {
                        ...finalizeData,
                        artistId: finalizedArtistId,
                        contractPdf: pdfPath,
                        featuredArtists: finalizeData.featuredArtists
                    }
                })
            });

            if (res.ok) {
                showToast("RELEASE_FINALIZED_SUCCESSFULLY", "success");
                router.push(`/dashboard/demo/${id}`);
            } else {
                const err = await res.json();
                showToast(err.error || "Failed to finalize", "error");
            }
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setProcessing(false);
        }
    };

    const filteredArtists = artists.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>

            {/* Header Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <Link href={`/dashboard?view=submissions`} style={{
                    fontSize: '9px', fontWeight: '900', color: '#666', letterSpacing: '3px', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s'
                }}>
                    <ChevronLeft size={14} /> EXIT_FINALIZATION
                </Link>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '40px', height: '4px', borderRadius: '2px',
                            background: i === step ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            boxShadow: i === step ? '0 0 10px rgba(0,255,136,0.3)' : 'none',
                            transition: 'all 0.4s ease'
                        }} />
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                {/* Left Info Panel */}
                <div>
                    <div style={{ position: 'sticky', top: '20px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '10px' }}>RELEASE_PROTOCOL</div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '15px', lineHeight: '1.2' }}>Finalize Release</h1>
                        <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.6', marginBottom: '30px' }}>
                            Transforming demo <span style={{ color: '#fff', fontWeight: 'bold' }}>"{demo.title}"</span> into an official release.
                            Please ensure all metadata is accurate as this will directly affect distribution.
                        </p>

                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>CURRENT_STEP</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: step === 1 ? '#fff' : '#444', marginBottom: '10px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 1 ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: step === 1 ? '#000' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>1</div>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>IDENTITY</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: step === 2 ? '#fff' : '#444', marginBottom: '10px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 2 ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: step === 2 ? '#000' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>2</div>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>FINANCIALS</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: step === 3 ? '#fff' : '#444' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 3 ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: step === 3 ? '#000' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>3</div>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>LOGISTICS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div style={{ ...glassStyle, padding: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Music size={20} color="var(--accent)" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Release Identity</h3>
                                            <p style={{ fontSize: '12px', color: '#444', letterSpacing: '0.5px' }}>Official credits and storefront appearance.</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                        {/* Release Title */}
                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>RELEASE_TITLE</label>
                                            <input
                                                type="text"
                                                value={finalizeData.releaseName}
                                                onChange={(e) => setFinalizeData({ ...finalizeData, releaseName: e.target.value })}
                                                style={inputStyle}
                                                placeholder="ENTER OFFICIAL TITLE..."
                                            />
                                        </div>

                                        {/* Primary Artist Selection */}
                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>PRIMARY_ARTIST</label>
                                            <div style={{ position: 'relative' }}>
                                                <div
                                                    onClick={() => setShowArtistDropdown(!showArtistDropdown)}
                                                    style={{
                                                        ...inputStyle,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        padding: '12px 20px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900' }}>
                                                            {selectedArtist?.name?.[0] || 'A'}
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '14px', fontWeight: '800', display: 'block' }}>{selectedArtist?.name || 'SELECT ARTIST'}</span>
                                                            <span style={{ fontSize: '10px', color: '#444' }}>
                                                                {selectedArtist?.isNew ? 'NEW_ARTIST_PROFILE_WILL_BE_CREATED' : (selectedArtist?.id === 'USER_LINKED' ? 'DIRECT USER LINK' : 'OFFICIAL ARTIST PROFILE')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} color="#333" style={{ transform: showArtistDropdown ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
                                                </div>

                                                <AnimatePresence>
                                                    {showArtistDropdown && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 'calc(100% + 10px)',
                                                                left: 0,
                                                                right: 0,
                                                                ...glassStyle,
                                                                zIndex: 100,
                                                                background: '#0a0a0b',
                                                                maxHeight: '300px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                overflowY: 'auto',
                                                                overflowX: 'hidden'
                                                            }}
                                                        >
                                                            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <input
                                                                    autoFocus
                                                                    placeholder="SEARCH OR TYPE NEW ARTIST NAME..."
                                                                    value={searchQuery}
                                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                                    style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', padding: '10px 15px' }}
                                                                />
                                                            </div>
                                                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                                                {/* Option to create new if no match or specifically requested */}
                                                                {searchQuery && !artists.some(a => a.name.toLowerCase() === searchQuery.toLowerCase()) && (
                                                                    <div
                                                                        onClick={() => {
                                                                            const newArt = { id: `NEW_${Date.now()}`, name: searchQuery, isNew: true };
                                                                            setSelectedArtist(newArt);
                                                                            setFinalizeData({ ...finalizeData, artistId: null });
                                                                            setShowArtistDropdown(false);
                                                                        }}
                                                                        style={{
                                                                            padding: '12px 20px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '12px',
                                                                            borderBottom: '1px solid rgba(0,255,136,0.1)',
                                                                            background: 'rgba(0,255,136,0.03)'
                                                                        }}
                                                                    >
                                                                        <Plus size={14} color="var(--accent)" />
                                                                        <div>
                                                                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)' }}>CREATE_NEW_ARTIST: "{searchQuery}"</span>
                                                                            <span style={{ fontSize: '10px', color: '#444', display: 'block' }}>WILL GENERATE OFFICIAL PROFILE ON FINALIZE</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {filteredArtists.map(artist => (
                                                                    <div
                                                                        key={artist.id}
                                                                        onClick={() => {
                                                                            setSelectedArtist(artist);
                                                                            setFinalizeData({ ...finalizeData, artistId: artist.id });
                                                                            setShowArtistDropdown(false);
                                                                        }}
                                                                        style={{
                                                                            padding: '12px 20px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '12px',
                                                                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                                            transition: 'all 0.2s',
                                                                            background: selectedArtist?.id === artist.id ? 'rgba(0,255,136,0.05)' : 'transparent'
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = selectedArtist?.id === artist.id ? 'rgba(0,255,136,0.05)' : 'transparent'}
                                                                    >
                                                                        <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>
                                                                            {artist.name[0]}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <span style={{ fontSize: '13px', fontWeight: '700', color: selectedArtist?.id === artist.id ? 'var(--accent)' : '#fff' }}>{artist.name}</span>
                                                                            <span style={{ fontSize: '10px', color: '#444', display: 'block' }}>{artist.email || 'NO_EMAIL_SET'}</span>
                                                                        </div>
                                                                        {selectedArtist?.id === artist.id && <CheckCircle size={14} color="var(--accent)" />}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <p style={{ fontSize: '10px', color: '#333', marginTop: '10px' }}>* Defaulting to submitting user. Select an official Artist Profile for accurate stats tracking.</p>
                                        </div>

                                        {/* Featured Artists / Collaborators */}
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '30px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px' }}>FEATURED_ARTISTS_&_COLLABORATORS</label>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...finalizeData.featuredArtists, { name: '', role: 'featured', id: null }];
                                                        setFinalizeData({ ...finalizeData, featuredArtists: newArr });
                                                    }}
                                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', padding: '8px 15px', borderRadius: '10px' }}
                                                >
                                                    <Plus size={14} /> ADD_ARTIST
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {finalizeData.featuredArtists.map((fa, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        key={idx}
                                                        style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <input
                                                                placeholder="ARTIST_NAME"
                                                                value={fa.name}
                                                                onChange={(e) => {
                                                                    const n = [...finalizeData.featuredArtists];
                                                                    n[idx].name = e.target.value;
                                                                    setFinalizeData({ ...finalizeData, featuredArtists: n });
                                                                }}
                                                                style={{ ...inputStyle, padding: '10px 15px' }}
                                                            />
                                                        </div>
                                                        <select
                                                            value={fa.role}
                                                            onChange={(e) => {
                                                                const n = [...finalizeData.featuredArtists];
                                                                n[idx].role = e.target.value;
                                                                setFinalizeData({ ...finalizeData, featuredArtists: n });
                                                            }}
                                                            style={{ ...inputStyle, width: '130px', padding: '10px 15px', background: 'rgba(255,255,255,0.03)' }}
                                                        >
                                                            <option value="featured">FEATURED</option>
                                                            <option value="with">WITH</option>
                                                            <option value="remixer">REMIXER</option>
                                                            <option value="producer">PRODUCER</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                const n = finalizeData.featuredArtists.filter((_, i) => i !== idx);
                                                                setFinalizeData({ ...finalizeData, featuredArtists: n });
                                                            }}
                                                            style={{ color: '#ff4444', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                                {finalizeData.featuredArtists.length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: '20px', color: '#222', fontSize: '10px', letterSpacing: '1.5px', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                                        NO_ADDITIONAL_ARTISTS_DEFINED
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}
                            >
                                <section>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '35px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={20} color="#00aaff" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Financial Terms</h3>
                                            <p style={{ fontSize: '12px', color: '#444', letterSpacing: '0.5px' }}>Revenue shares and collaborator percentages.</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '50px' }}>
                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>ARTIST_SHARE</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number" step="0.01" min="0" max="1"
                                                    value={finalizeData.artistShare}
                                                    onChange={(e) => setFinalizeData({ ...finalizeData, artistShare: e.target.value, labelShare: (1 - parseFloat(e.target.value || 0)).toFixed(2) })}
                                                    style={{ ...inputStyle, paddingRight: '45px' }}
                                                />
                                                <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: '900', color: 'var(--accent)' }}>%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>LABEL_SHARE</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number" step="0.01" min="0" max="1"
                                                    value={finalizeData.labelShare}
                                                    onChange={(e) => setFinalizeData({ ...finalizeData, labelShare: e.target.value, artistShare: (1 - parseFloat(e.target.value || 0)).toFixed(2) })}
                                                    style={{ ...inputStyle, paddingRight: '45px' }}
                                                />
                                                <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: '900', color: '#444' }}>%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '40px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px' }}>COLLABORATOR_SPLITS</label>
                                            <button
                                                onClick={() => setFinalizeData({ ...finalizeData, splits: [...finalizeData.splits, { name: '', percentage: 0 }] })}
                                                style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', padding: '8px 15px', borderRadius: '10px' }}
                                            >
                                                <Plus size={14} /> ADD COLLABORATOR
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {finalizeData.splits.map((s, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={i}
                                                    style={{ display: 'flex', gap: '15px', alignItems: 'center' }}
                                                >
                                                    <input placeholder="NAME_OR_EMAIL" value={s.name} onChange={(e) => {
                                                        const n = [...finalizeData.splits];
                                                        n[i].name = e.target.value;
                                                        setFinalizeData({ ...finalizeData, splits: n });
                                                    }} style={inputStyle} />
                                                    <div style={{ position: 'relative', minWidth: '120px' }}>
                                                        <input type="number" placeholder="0" value={s.percentage} onChange={(e) => {
                                                            const n = [...finalizeData.splits];
                                                            n[i].percentage = e.target.value;
                                                            setFinalizeData({ ...finalizeData, splits: n });
                                                        }} style={{ ...inputStyle, textAlign: 'right', paddingRight: '35px' }} />
                                                        <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#444', fontWeight: '900' }}>%</span>
                                                    </div>
                                                    <button onClick={() => setFinalizeData({ ...finalizeData, splits: finalizeData.splits.filter((_, idx) => idx !== i) })} style={{ color: '#ff4444', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)', cursor: 'pointer', padding: '12px', borderRadius: '12px' }}>
                                                        <X size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                            {finalizeData.splits.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.03)', color: '#333', fontSize: '11px', letterSpacing: '2px' }}>
                                                    NO_EXTERNAL_COLLABORATORS
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}
                            >
                                <section>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '35px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={20} color="#ffaa00" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Assets & Logistics</h3>
                                            <p style={{ fontSize: '12px', color: '#444', letterSpacing: '0.5px' }}>Final documentation and release scheduling.</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>SCHEDULED_DISTRIBUTION_DATE</label>
                                            <input
                                                type="date"
                                                value={finalizeData.releaseDate}
                                                onChange={(e) => setFinalizeData({ ...finalizeData, releaseDate: e.target.value })}
                                                style={{ ...inputStyle, colorScheme: 'dark' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>SIGNED_CONTRACT_BUNDLE (PDF)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input type="file" accept=".pdf" onChange={(e) => setFinalizeData({ ...finalizeData, contractPdf: e.target.files[0] })}
                                                    style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
                                                <div style={{
                                                    ...inputStyle,
                                                    height: '140px',
                                                    borderStyle: 'dashed',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '15px',
                                                    borderColor: finalizeData.contractPdf ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                    background: finalizeData.contractPdf ? 'rgba(0,255,136,0.02)' : 'rgba(255,255,255,0.01)'
                                                }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Upload size={20} color={finalizeData.contractPdf ? 'var(--accent)' : '#222'} />
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '11px', color: finalizeData.contractPdf ? '#fff' : '#666', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>
                                                            {finalizeData.contractPdf ? finalizeData.contractPdf.name.toUpperCase() : 'UPLOAD_LEGAL_DOC_PDF'}
                                                        </span>
                                                        <span style={{ fontSize: '9px', color: '#333' }}>MAX_FILE_SIZE: 10MB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '12px', display: 'block' }}>INTERNAL_RELEASE_NOTES</label>
                                            <textarea
                                                value={finalizeData.notes}
                                                onChange={(e) => setFinalizeData({ ...finalizeData, notes: e.target.value })}
                                                placeholder="ADD INTERNAL NOTES..."
                                                style={{ ...inputStyle, height: '120px', resize: 'none', lineHeight: '1.6' }}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '80px', paddingTop: '50px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} style={{ ...btnStyle, flex: 1, background: 'rgba(255,255,255,0.02)', color: '#666' }}>
                                <ChevronLeft size={16} /> REVERT_STEP
                            </button>
                        ) : (
                            <Link href={`/dashboard/demo/${id}`} style={{
                                ...btnStyle, flex: 1, textAlign: 'center', textDecoration: 'none', color: '#ff4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,68,68,0.1)',
                                background: 'rgba(255,68,68,0.02)'
                            }}>
                                ABORT_PROCESS
                            </Link>
                        )}

                        {step < 3 ? (
                            <button onClick={() => setStep(step + 1)} style={{ ...btnStyle, flex: 1, background: '#fff', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                PROCEED_TO_{step === 1 ? 'TERMS' : 'LOGISTICS'} <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                disabled={processing}
                                onClick={handleFinalize}
                                style={{
                                    ...btnStyle, flex: 1, background: 'var(--accent)', color: '#000', border: 'none',
                                    boxShadow: '0 10px 40px rgba(0,255,136,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <CheckCircle size={16} /> {processing ? 'INITIALIZING_RELEASE...' : 'EXECUTE_FINALIZATION'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                input:focus, textarea:focus { 
                    border-color: rgba(255,255,255,0.1) !important; 
                    background: rgba(255,255,255,0.04) !important;
                    box-shadow: 0 0 30px rgba(255,255,255,0.02); 
                }
                button:hover:not(:disabled) { 
                    transform: translateY(-2px); 
                    filter: brightness(1.2); 
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                }
                button:active { transform: translateY(0); }
                button:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
