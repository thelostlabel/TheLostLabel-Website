"use client";
import { useState, useEffect, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, Upload, Info } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';

const glassStyle = {
    background: 'var(--surface)',
    backdropFilter: 'blur(18px)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
};

const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const btnStyle = {
    padding: '12px 15px',
    fontSize: '9px',
    fontWeight: '900',
    letterSpacing: '1px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    width: '100%'
};

export default function DemoReviewPage({ params }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast, showConfirm } = useToast();
    const [demo, setDemo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchDemo = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchDemo();
    }, [fetchDemo]);

    const handleStatusUpdate = async (status) => {
        let reason = null;
        if (status === 'rejected') {
            reason = prompt("Please provide a reason for rejection (Visible to Artist):");
            if (reason === null) return; // Cancelled
        }

        setProcessing(true);
        try {
            // Simple status update (Reviewing, Approved, Rejected)
            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason: reason })
            });

            if (res.ok) {
                const updated = await res.json();
                setDemo(updated);
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            alert("Error updating status");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', padding: '100px', textAlign: 'center' }}>LOADING DEMO...</div>;
    if (error || !demo) return <div style={{ padding: '40px', textAlign: 'center' }}><h2>ERROR: {error || "Demo not found"}</h2><Link href="/dashboard" style={{ color: 'var(--accent)' }}>GO BACK</Link></div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--accent)';
            case 'rejected': return '#ff4444';
            case 'reviewing': return '#F59E0B';
            default: return '#888';
        }
    };

    const activeFileUrl = activeFile ? `/api/files/demo/${activeFile.id}` : null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header / Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <Link href="/dashboard?view=submissions" style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '2px',
                    color: '#8b92a7',
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
                        <div style={{ display: 'flex', gap: '30px', color: '#8b92a7', fontSize: '13px', fontWeight: '600' }}>
                            <span style={{ color: '#cdd3e1' }}>{demo.genre}</span>
                            <span>•</span>
                            <span>Submitted {new Date(demo.createdAt).toLocaleDateString()} at {new Date(demo.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {/* Artist Box */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '30px', borderRadius: '12px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
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
                            background: 'var(--surface)',
                            padding: '30px',
                            borderRadius: '8px',
                            fontSize: '15px',
                            lineHeight: '1.8',
                            color: '#ccc',
                            border: '1px solid var(--border)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {demo.message || "The artist did not include a message with this submission."}
                        </div>
                    </div>

                    {/* Audio Player Section */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', fontWeight: '800', marginBottom: '20px' }}>STUDIO PLAYER</h4>

                        {activeFile ? (
                            <div>
                                <div style={{
                                    background: 'var(--surface-hover)',
                                    padding: '30px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>
                                        NOW MONITORING: <span style={{ color: '#fff', fontWeight: '800' }}>{activeFile.filename.toUpperCase()}</span>
                                    </p>
                                    <audio controls key={activeFileUrl} style={{ width: '100%', height: '54px' }}>
                                        <source src={activeFileUrl} type="audio/wav" />
                                        <source src={activeFileUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                    <a href={`${activeFileUrl}?download=1`} download className="btn-secondary" style={{ padding: '12px 25px', fontSize: '11px', letterSpacing: '1px' }}>
                                        DOWNLOAD SOURCE FILE
                                    </a>
                                </div>
                            </div>
                        ) : demo.trackLink ? (
                            <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed var(--border)', borderRadius: '8px' }}>
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
                                        background: activeFile?.id === file.id ? 'var(--surface-hover)' : 'var(--surface)',
                                        border: '1px solid',
                                        borderColor: activeFile?.id === file.id ? 'var(--accent)' : 'var(--border)',
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
                    <div className="glass" style={{ padding: '30px', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}>
                        <h4 style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', fontWeight: '800', marginBottom: '20px' }}>A&R DECISION</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button
                                    onClick={() => handleStatusUpdate('reviewing')}
                                    disabled={processing}
                                    style={{
                                        ...btnStyle,
                                        background: demo.status === 'reviewing' ? 'rgba(255, 170, 0, 0.2)' : 'transparent',
                                        color: '#ffaa00',
                                        borderColor: '#ffaa0040',
                                        opacity: processing ? 0.5 : 1
                                    }}
                                >
                                    REVIEWING
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('pending')}
                                    disabled={processing}
                                    style={{
                                        ...btnStyle,
                                        background: demo.status === 'pending' ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        color: '#fff',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        opacity: processing ? 0.5 : 1
                                    }}
                                >
                                    PENDING
                                </button>
                            </div>
                            <button
                                onClick={() => handleStatusUpdate('approved')}
                                disabled={processing}
                                style={{
                                    ...btnStyle,
                                    background: demo.status === 'approved' ? 'rgba(245, 197, 66, 0.22)' : 'transparent',
                                    color: 'var(--accent)',
                                    borderColor: 'rgba(245, 197, 66, 0.4)',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                {demo.status === 'approved' ? '✓ APPROVED' : 'APPROVE'}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('rejected')}
                                disabled={processing}
                                style={{
                                    ...btnStyle,
                                    background: demo.status === 'rejected' ? 'rgba(255, 68, 68, 0.2)' : 'transparent',
                                    color: '#ff4444',
                                    borderColor: '#ff444440',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                {demo.status === 'rejected' ? '✖ REJECTED' : 'REJECT'}
                            </button>
                        </div>

                        {demo.status === 'approved' && (
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <Link
                                    href={`/dashboard/demo/${id}/finalize`}
                                    className="glow-button"
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        fontSize: '12px',
                                        display: 'block',
                                        textAlign: 'center',
                                        textDecoration: 'none'
                                    }}
                                >
                                    PROCEED TO FINALIZATION & CONTRACT
                                </Link>
                                <p style={{ fontSize: '9px', color: '#444', textAlign: 'center', marginTop: '10px', letterSpacing: '1px' }}>
                                    You will be guided through identity, financials, and assets.
                                </p>
                            </div>
                        )}

                        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
                            {demo.reviewedBy && (
                                <p>Last handle by <strong>{demo.reviewedBy}</strong></p>
                            )}
                        </div>

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => {
                                    showConfirm(
                                        "DELETE RECORD?",
                                        "Are you absolutely sure you want to PERMANENTLY delete this demo? This action is irreversible.",
                                        () => {
                                            fetch(`/api/demo/${id}`, { method: 'DELETE' })
                                                .then(() => {
                                                    showToast("Demo deleted successfully", "success");
                                                    router.push('/dashboard?view=submissions');
                                                })
                                                .catch(err => showToast("Failed to delete demo", "error"));
                                        }
                                    );
                                }}
                                style={{ background: 'none', border: 'none', color: '#333', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '100%' }}
                            >
                                DELETE RECORD
                            </button>
                        </div>
                    </div>

                </div>
            </div>


            <style jsx>{`
                .glow-button { background: #fff; color: #000; border: none; box-shadow: 0 4px 20px rgba(255,255,255,0.1); }
                .glow-button:hover { background: var(--accent); box-shadow: 0 4px 25px rgba(245,197,66,0.35); transform: translateY(-2px); }
                .glow-button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
            `}</style>
        </div>
    );
}
