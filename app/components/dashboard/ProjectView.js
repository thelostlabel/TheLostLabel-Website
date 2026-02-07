import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, FileText, Music, Upload,
    Calendar, AlertCircle, ArrowLeft, ChevronRight,
    Play, Pause, Download, RefreshCw
} from 'lucide-react';
import ContractSigningModal from './ContractSigningModal';

const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
};

const btnStyle = {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    padding: '12px 25px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px'
};

const stages = [
    { id: 'demo', label: 'DEMO SUBMITTED', icon: Music },
    { id: 'review', label: 'IN REVIEW', icon: Clock },
    { id: 'deal', label: 'DEAL OFFERED', icon: FileText },
    { id: 'signing', label: 'SIGNING', icon: FileText },
    { id: 'production', label: 'PRODUCTION', icon: Upload },
    { id: 'scheduled', label: 'SCHEDULED', icon: Calendar },
    { id: 'live', label: 'RELEASED', icon: CheckCircle }
];

export default function ProjectView({ projectId, onBack, user }) {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSignModal, setShowSignModal] = useState(false);

    // Audio Player State
    const [playing, setPlaying] = useState(false);
    const [audio, setAudio] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/demo/${projectId}`);
                const data = await res.json();
                if (res.ok) setProject(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchProject();

        return () => {
            if (audio) { audio.pause(); }
        }
    }, [projectId, refreshTrigger]);

    const handlePlay = (url) => {
        if (playing && audio) {
            audio.pause();
            setPlaying(false);
        } else {
            if (audio) audio.pause();
            const newAudio = new Audio(url);
            newAudio.onended = () => setPlaying(false);
            newAudio.play();
            setAudio(newAudio);
            setPlaying(true);
        }
    };

    const getCurrentStageIndex = (p) => {
        if (!p) return 0;
        if (p.status === 'pending') return 1; // Review
        if (p.status === 'reviewing') return 1;
        if (p.status === 'rejected') return 1; // Stuck at review
        if (p.status === 'approved') return 2; // Deal Offered (Waiting for contract)
        if (p.status === 'contract_sent') return 3; // Signing
        // For signed, we check contract status
        const isSigned = p.contract?.status === 'active' || p.contract?.signedAt;
        if (isSigned) {
            if (p.scheduledReleaseDate) {
                const isLive = new Date(p.scheduledReleaseDate) <= new Date();
                if (isLive) return 6; // Live (Released)
                return 5; // Scheduled
            }
            return 4; // Production (Needs assets)
        }
        return 0;
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#666', letterSpacing: '2px' }}>LOADING PROJECT...</div>;
    if (!project) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>PROJECT NOT FOUND</div>;

    const currentStageIndex = getCurrentStageIndex(project);
    const demoFileUrl = project.files?.[0] ? `/api/files/demo/${project.files[0].id}` : null;
    const progress = (currentStageIndex / (stages.length - 1)) * 100;

    const coverArtPreview = coverArt?.startsWith('private/') ? `/api/files/asset?path=${encodeURIComponent(coverArt)}` : coverArt;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>{project.title}</h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '2px', fontWeight: '800' }}>
                            {stages[currentStageIndex].label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#444' }}>•</span>
                        <span style={{ fontSize: '11px', color: '#666' }}>ID: {project.id.slice(0, 8)}</span>
                    </div>
                </div>
            </div>

            {/* Timeline Stepper */}
            <div style={{ ...glassStyle, padding: '30px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '80px', right: '80px', height: '2px', background: 'rgba(255,255,255,0.05)', currentPage: '12px' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {stages.map((stage, index) => {
                        const isActive = index === currentStageIndex;
                        const isPast = index < currentStageIndex;
                        const Icon = stage.icon;

                        return (
                            <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 2 }}>
                                <motion.div
                                    animate={{
                                        backgroundColor: isActive || isPast ? '#00ff88' : '#111',
                                        borderColor: isActive ? '#00ff88' : 'rgba(255,255,255,0.1)',
                                        scale: isActive ? 1.2 : 1
                                    }}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid',
                                        background: '#111'
                                    }}
                                >
                                    <Icon size={16} color={isActive || isPast ? '#000' : '#444'} />
                                </motion.div>
                                <div style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px', color: isActive ? '#fff' : '#444' }}>
                                    {stage.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Stage Content */}
            <motion.div
                key={currentStageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* 1. Review Stage */}
                {currentStageIndex === 1 && (
                    <div style={{ ...glassStyle, padding: '50px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={32} color="#666" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>IN REVIEW</h2>
                        <p style={{ fontSize: '12px', color: '#666', maxWidth: '400px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                            Our A&R team is currently listening to your demo. You will be notified via email once a decision has been made.
                        </p>
                        {/* Audio Player if pending */}
                        {project.files?.[0] && (
                            <button
                                onClick={() => handlePlay(demoFileUrl || project.trackLink)}
                                style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            >
                                {playing ? <Pause size={14} /> : <Play size={14} />}
                                {playing ? 'PAUSE DEMO' : 'PLAY DEMO'}
                            </button>
                        )}
                    </div>
                )}

                {/* 2. Deal Offered (Approved) */}
                {currentStageIndex === 2 && (
                    <div style={{ ...glassStyle, padding: '50px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(0,255,136,0.05) 0%, transparent 70%)' }}>
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', color: '#fff' }}>CONGRATULATIONS!</h2>
                            <p style={{ fontSize: '13px', color: '#00ff88', letterSpacing: '3px', fontWeight: '900' }}>WE WANT TO SIGN THIS TRACK</p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', maxWidth: '500px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                            Our team is preparing the contract details. You will receive a notification when the official agreement is ready for your signature.
                        </p>
                    </div>
                )}

                {/* 3. Signing (Contract Sent) */}
                {currentStageIndex === 3 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div style={{ ...glassStyle, padding: '40px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '20px' }}>OFFICIAL AGREEMENT</h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '30px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>Recording Agreement</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>Standard Exclusive License</div>
                                </div>
                                <FileText size={20} color="#666" />
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span style={{ color: '#666' }}>ARTIST SHARE</span>
                                    <span style={{ color: '#fff', fontWeight: '800' }}>{project.contract?.artistShare * 100}%</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span style={{ color: '#666' }}>LABEL SHARE</span>
                                    <span style={{ color: '#fff', fontWeight: '800' }}>{project.contract?.labelShare * 100}%</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span style={{ color: '#666' }}>TERM</span>
                                    <span style={{ color: '#fff', fontWeight: '800' }}>Perpetual</span>
                                </li>
                            </ul>
                        </div>
                        <div style={{ ...glassStyle, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginBottom: '30px', lineHeight: '1.6' }}>
                                Please review the terms and sign the agreement to proceed to the production phase.
                            </p>
                            <button
                                onClick={() => setShowSignModal(true)}
                                className="glow-button"
                                style={{ padding: '15px 40px', fontSize: '12px' }}
                            >
                                REVIEW & SIGN
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. Production (Assets) */}
                {currentStageIndex === 4 && (
                    <ProductionView project={project} onUpdate={() => setRefreshTrigger(prev => prev + 1)} />
                )}

                {/* 5. Scheduled */}
                {currentStageIndex === 5 && (
                    <div style={{ ...glassStyle, padding: '50px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>RELEASE SCHEDULED</h2>
                        <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--accent)', margin: '20px 0', letterSpacing: '-2px' }}>
                            {new Date(project.scheduledReleaseDate).toLocaleDateString()}
                        </div>
                        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#666' }}>DISTRIBUTION IN PROGRESS</p>
                    </div>
                )}
                {/* 6. Live */}
                {currentStageIndex === 6 && (
                    <div style={{ ...glassStyle, padding: '50px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>RELEASED</h2>
                        <p style={{ fontSize: '12px', color: '#666' }}>This track is live on all platforms.</p>
                        <button onClick={() => onBack()} style={{ marginTop: '20px', ...btnStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            VIEW ANALYTICS (Overview)
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Modals */}
            <ContractSigningModal
                contract={project.contract}
                user={user}
                onClose={() => setShowSignModal(false)}
                onComplete={() => {
                    setShowSignModal(false);
                    setRefreshTrigger(p => p + 1);
                }}
            />
        </div>
    );
}

function ProductionView({ project, onUpdate }) {
    const [date, setDate] = useState(project.scheduledReleaseDate ? project.scheduledReleaseDate.split('T')[0] : '');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingArt, setUploadingArt] = useState(false);
    const [coverArt, setCoverArt] = useState(project.contract?.release?.image || null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadArtwork(file);
    };

    const uploadArtwork = async (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG)');
            return;
        }

        setUploadingArt(true);
        const formData = new FormData();
        formData.append('files', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.files?.[0]) {
                setCoverArt(data.files[0].filepath);
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Upload failed');
        } finally {
            setUploadingArt(false);
        }
    };

    const handleSave = async () => {
        if (!date) return alert('Please select a release date');
        if (!coverArt) return alert('Please upload cover art');

        setSubmitting(true);
        try {
            const res = await fetch(`/api/demo/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduledReleaseDate: date,
                    coverArtUrl: coverArt
                })
            });
            if (res.ok) {
                onUpdate();
            } else {
                alert('Failed to submit');
            }
        } catch (e) { alert('Failed to save'); }
        finally { setSubmitting(false); }
    };

    return (
        <div style={{ ...glassStyle, padding: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '30px' }}>RELEASE ASSETS</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>COVER ART</label>
                    <div
                        onClick={() => !uploadingArt && fileInputRef.current?.click()}
                        style={{
                            aspectRatio: '1/1', background: '#111', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px dashed rgba(255,255,255,0.1)', cursor: uploadingArt ? 'wait' : 'pointer',
                            overflow: 'hidden', position: 'relative'
                        }}>
                        {coverArt ? (
                            <img src={coverArtPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <Upload size={24} color="#444" style={{ marginBottom: '10px' }} />
                                <div style={{ fontSize: '10px', color: '#666' }}>{uploadingArt ? 'UPLOADING...' : 'UPLOAD 3000x3000px'}</div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>
                <div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#666', marginBottom: '10px', letterSpacing: '1px' }}>RELEASE DATE</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{
                                width: '100%', padding: '15px', background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                                borderRadius: '8px', fontSize: '13px'
                            }}
                        />
                        <p style={{ fontSize: '9px', color: '#555', marginTop: '8px' }}>Min. 2 weeks from today recommended.</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="glow-button"
                        style={{ width: '100%', padding: '15px' }}
                    >
                        {submitting ? 'SUBMITTING...' : 'SUBMIT FOR DISTRIBUTION'}
                    </button>

                    {submitting && <p style={{ fontSize: '10px', color: '#aaa', marginTop: '10px', textAlign: 'center' }}>This may take a moment...</p>}
                </div>
            </div>
        </div>
    );
}
