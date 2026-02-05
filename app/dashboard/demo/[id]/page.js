"use client";
import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
};

const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s'
};

export default function DemoReviewPage({ params }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [demo, setDemo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approving, setApproving] = useState(false);
    const [finalizeData, setFinalizeData] = useState({
        releaseName: '',
        releaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 2 weeks from now
        artistShare: '0.70',
        labelShare: '0.30',
        notes: ''
    });

    useEffect(() => {
        if (demo) {
            setFinalizeData(prev => ({ ...prev, releaseName: demo.title }));
        }
    }, [demo]);

    useEffect(() => {
        fetchDemo();
    }, [id]);

    const fetchDemo = async () => {
        try {
            const res = await fetch(`/api/demo/${id}`);
            const data = await res.json();
            if (data) {
                setDemo(data);
                if (data.files?.length > 0) {
                    setActiveFile(data.files[0]);
                }
            } else {
                setError("Demo not found");
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        let reason = null;
        if (status === 'rejected') {
            reason = prompt("Please provide a reason for rejection (Visible to Artist):");
            if (reason === null) return; // Cancelled
        }

        try {
            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason: reason })
            });
            if (res.ok) {
                router.push('/dashboard?view=submissions');
            }
        } catch (e) {
            alert("Error updating status");
        }
    };

    if (loading) return <div style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', padding: '100px', textAlign: 'center' }}>LOADING DEMO...</div>;
    if (error || !demo) return <div style={{ padding: '40px', textAlign: 'center' }}><h2>ERROR: {error || "Demo not found"}</h2><Link href="/dashboard" style={{ color: 'var(--accent)' }}>GO BACK</Link></div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#00ff88';
            case 'rejected': return '#ff4444';
            case 'reviewing': return '#ffaa00';
            default: return '#888';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header / Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <Link href="/dashboard?view=submissions" style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '2px',
                    color: '#666',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    ← BACK TO SUBMISSIONS
                </Link>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ fontSize: '10px', color: '#333', fontWeight: '800', letterSpacing: '1px' }}>ID: {demo.id.substring(0, 8)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '50px', alignItems: 'start' }}>

                {/* Left Side: Detail & Player */}
                <div>
                    <div style={{ marginBottom: '50px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '4px', fontWeight: '800', marginBottom: '15px' }}>
                            {demo.status.toUpperCase()} SUBMISSION
                        </p>
                        <h1 style={{ fontSize: '48px', marginBottom: '15px', fontWeight: '900', letterSpacing: '-1px' }}>{demo.title}</h1>
                        <div style={{ display: 'flex', gap: '30px', color: '#666', fontSize: '13px', fontWeight: '600' }}>
                            <span style={{ color: '#aaa' }}>{demo.genre}</span>
                            <span>•</span>
                            <span>Submitted {new Date(demo.createdAt).toLocaleDateString()} at {new Date(demo.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {/* Artist Box */}
                    <div style={{ background: '#0a0a0b', border: '1px solid #1a1a1b', padding: '30px', borderRadius: '8px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', fontWeight: '800', marginBottom: '8px' }}>ARTIST PROFILE</p>
                            <h2 style={{ fontSize: '24px' }}>{demo.artist?.stageName || 'Anonymous'}</h2>
                            <p style={{ color: '#666', fontSize: '13px' }}>{demo.artist?.email}</p>
                        </div>
                        {demo.artist?.spotifyUrl && (
                            <a href={demo.artist.spotifyUrl} target="_blank" className="glow-button" style={{ padding: '10px 20px', fontSize: '10px' }}>
                                SPOTIFY PROFILE
                            </a>
                        )}
                    </div>

                    {/* Message */}
                    <div style={{ marginBottom: '40px' }}>
                        <h4 style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', fontWeight: '800', marginBottom: '15px' }}>MESSAGE FROM ARTIST</h4>
                        <div style={{
                            background: '#070708',
                            padding: '30px',
                            borderRadius: '8px',
                            fontSize: '15px',
                            lineHeight: '1.8',
                            color: '#ccc',
                            border: '1px solid #111',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {demo.message || "The artist did not include a message with this submission."}
                        </div>
                    </div>

                    {/* Audio Player Section */}
                    <div style={{ background: '#0a0a0b', border: '1px solid #1a1a1b', padding: '40px', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', fontWeight: '800', marginBottom: '20px' }}>STUDIO PLAYER</h4>

                        {activeFile ? (
                            <div>
                                <div style={{
                                    background: '#111',
                                    padding: '30px',
                                    borderRadius: '8px',
                                    border: '1px solid #222',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>
                                        NOW MONITORING: <span style={{ color: '#fff', fontWeight: '800' }}>{activeFile.filename.toUpperCase()}</span>
                                    </p>
                                    <audio controls key={activeFile.filepath} style={{ width: '100%', height: '54px' }}>
                                        <source src={activeFile.filepath} type="audio/wav" />
                                        <source src={activeFile.filepath} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                    <a href={activeFile.filepath} download className="btn-secondary" style={{ padding: '12px 25px', fontSize: '11px', letterSpacing: '1px' }}>
                                        DOWNLOAD SOURCE FILE
                                    </a>
                                </div>
                            </div>
                        ) : demo.trackLink ? (
                            <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #222', borderRadius: '8px' }}>
                                <p style={{ fontSize: '13px', color: '#666', marginBottom: '25px' }}>This submission is hosted on an external platform.</p>
                                <a href={demo.trackLink} target="_blank" className="glow-button" style={{ padding: '15px 40px' }}>
                                    OPEN EXTERNAL LINK
                                </a>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>No audio data provided.</div>
                        )}
                    </div>
                </div>

                {/* Right Side: Files & Actions */}
                <div style={{ position: 'sticky', top: '40px' }}>

                    {/* File List */}
                    <div style={{ marginBottom: '40px' }}>
                        <h4 style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', fontWeight: '800', marginBottom: '15px' }}>SUBMITTED FILES ({demo.files?.length || 0})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {demo.files?.map((file, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveFile(file)}
                                    style={{
                                        padding: '15px',
                                        background: activeFile?.id === file.id ? '#151515' : '#0a0a0b',
                                        border: '1px solid',
                                        borderColor: activeFile?.id === file.id ? 'var(--accent)' : '#1a1a1b',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}
                                >
                                    <div style={{ fontSize: '20px' }}>{activeFile?.id === file.id ? '🔊' : '📁'}</div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: activeFile?.id === file.id ? '#fff' : '#aaa' }}>
                                            {file.filename}
                                        </p>
                                        <p style={{ fontSize: '10px', color: '#444' }}>{(file.filesize / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="glass" style={{ padding: '30px', border: '1px solid #222', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', fontWeight: '800', marginBottom: '20px' }}>A&R DECISION</h4>

                        {demo.status === 'pending' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="glow-button"
                                    style={{ width: '100%', padding: '18px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}
                                >
                                    APPROVE SUBMISSION
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        background: 'transparent',
                                        border: '1px solid #ff4444',
                                        color: '#ff4444',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        letterSpacing: '2px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    REJECT SUBMISSION
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    padding: '20px',
                                    border: '1px solid #1a1a1b',
                                    borderRadius: '6px',
                                    marginBottom: '20px'
                                }}>
                                    <p style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '10px' }}>FINAL STATUS</p>
                                    <p style={{ fontSize: '18px', fontWeight: '900', color: getStatusColor(demo.status), letterSpacing: '2px' }}>
                                        {demo.status.toUpperCase()}
                                    </p>
                                </div>
                                <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.6' }}>
                                    Reviewed by <br /><strong>{demo.reviewedBy}</strong><br />
                                    on {demo.reviewedAt ? new Date(demo.reviewedAt).toLocaleDateString() : '---'}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #1a1a1b' }}>
                            <button
                                onClick={() => {
                                    if (confirm('Are you absolutely sure you want to PERMANENTLY delete this demo?')) {
                                        fetch(`/api/demo/${id}`, { method: 'DELETE' }).then(() => router.push('/dashboard?view=submissions'));
                                    }
                                }}
                                style={{ background: 'none', border: 'none', color: '#333', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '100%' }}
                            >
                                DELETE RECORD
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Approval Modal */}
            {showApproveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="glass" style={{
                        width: '100%', maxWidth: '500px', padding: '40px',
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                        display: 'flex', flexDirection: 'column', gap: '25px'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '18px', letterSpacing: '2px', fontWeight: '900', marginBottom: '10px' }}>FINALIZE_APPROVAL</h2>
                            <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
                                Set the release details and commission splits. This will automatically create an active contract and release record.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>RELEASE NAME</label>
                                <input
                                    type="text"
                                    value={finalizeData.releaseName}
                                    onChange={(e) => setFinalizeData({ ...finalizeData, releaseName: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>SCHEDULED RELEASE DATE</label>
                                <input
                                    type="date"
                                    value={finalizeData.releaseDate}
                                    onChange={(e) => setFinalizeData({ ...finalizeData, releaseDate: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>ARTIST SHARE (0-1.0)</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={finalizeData.artistShare}
                                        onChange={(e) => setFinalizeData({ ...finalizeData, artistShare: e.target.value, labelShare: (1 - parseFloat(e.target.value)).toFixed(2) })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>LABEL SHARE (0-1.0)</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={finalizeData.labelShare}
                                        onChange={(e) => setFinalizeData({ ...finalizeData, labelShare: e.target.value, artistShare: (1 - parseFloat(e.target.value)).toFixed(2) })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>CONTRACT NOTES</label>
                                <textarea
                                    value={finalizeData.notes}
                                    onChange={(e) => setFinalizeData({ ...finalizeData, notes: e.target.value })}
                                    placeholder="Optional notes for the contract..."
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button
                                disabled={approving}
                                onClick={async () => {
                                    setApproving(true);
                                    try {
                                        const res = await fetch(`/api/demo/${id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                status: 'approved',
                                                finalizeData
                                            })
                                        });
                                        if (res.ok) {
                                            router.push('/dashboard?view=submissions');
                                        } else {
                                            const err = await res.json();
                                            alert(err.error || "Failed to approve");
                                        }
                                    } catch (e) {
                                        alert("Approval error");
                                    } finally {
                                        setApproving(false);
                                    }
                                }}
                                className="glow-button"
                                style={{ flex: 1, padding: '15px', fontWeight: '900' }}
                            >
                                {approving ? 'CONFIRMING...' : 'CONFIRM_APPROVAL'}
                            </button>
                            <button
                                onClick={() => setShowApproveModal(false)}
                                style={{
                                    flex: 0.5, padding: '15px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)', color: '#fff',
                                    borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '10px'
                                }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-secondary {
                    background: #111;
                    border: 1px solid #222;
                    color: #fff;
                    font-weight: 800;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    background: #1a1a1a;
                    border-color: #333;
                }
            `}</style>
        </div>
    );
}
