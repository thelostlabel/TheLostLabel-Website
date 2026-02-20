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
        <div className="demo-review-shell">
            <div className="demo-review-head">
                <Link href="/dashboard?view=submissions" className="subtle-link">
                    ← BACK TO SUBMISSIONS
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="chip">ID: {demo.id.substring(0, 8)}</span>
                    <span className="chip" style={{ color: getStatusColor(demo.status), borderColor: `${getStatusColor(demo.status)}55` }}>
                        {demo.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="demo-review-grid">
                <div>
                    <div className="panel hero-panel">
                        <p className="kicker">DEMO REVIEW</p>
                        <h1 className="title">{demo.title}</h1>
                        <div className="meta-row">
                            <span>{demo.genre || 'Unknown Genre'}</span>
                            <span>•</span>
                            <span>{new Date(demo.createdAt).toLocaleDateString()} {new Date(demo.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <div className="panel artist-panel">
                        <div>
                            <p className="kicker">ARTIST PROFILE</p>
                            <h2 style={{ fontSize: '22px', margin: '6px 0 4px 0', fontWeight: 900 }}>{demo.artist?.stageName || 'Anonymous'}</h2>
                            <p style={{ color: '#777', fontSize: '13px', margin: 0 }}>{demo.artist?.email}</p>
                        </div>
                        {demo.artist?.spotifyUrl && (
                            <a href={demo.artist.spotifyUrl} target="_blank" rel="noreferrer" className="primary-btn" style={{ padding: '10px 16px', width: 'auto' }}>
                                SPOTIFY PROFILE
                            </a>
                        )}
                    </div>

                    <div className="panel" style={{ marginTop: '14px' }}>
                        <h4 className="kicker" style={{ marginBottom: '12px' }}>MESSAGE FROM ARTIST</h4>
                        <div className="message-box">
                            {demo.message || "The artist did not include a message with this submission."}
                        </div>
                    </div>

                    <div className="panel" style={{ marginTop: '14px' }}>
                        <h4 className="kicker" style={{ marginBottom: '16px' }}>STUDIO PLAYER</h4>

                        {activeFile ? (
                            <div>
                                <div className="player-box">
                                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
                                        NOW PLAYING: <span style={{ color: '#fff', fontWeight: 800 }}>{activeFile.filename.toUpperCase()}</span>
                                    </p>
                                    <audio controls key={activeFileUrl} style={{ width: '100%', height: '52px' }}>
                                        <source src={activeFileUrl} type="audio/wav" />
                                        <source src={activeFileUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                                    <a href={`${activeFileUrl}?download=1`} download className="secondary-btn" style={{ padding: '10px 16px', fontSize: '10px' }}>
                                        DOWNLOAD SOURCE FILE
                                    </a>
                                </div>
                            </div>
                        ) : demo.trackLink ? (
                            <div className="player-box" style={{ textAlign: 'center', borderStyle: 'dashed' }}>
                                <p style={{ fontSize: '13px', color: '#666', marginBottom: '18px' }}>This submission is hosted on an external platform.</p>
                                <a href={demo.trackLink} target="_blank" rel="noreferrer" className="primary-btn" style={{ width: 'auto', padding: '11px 20px' }}>
                                    OPEN EXTERNAL LINK
                                </a>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '36px', color: '#555' }}>No audio data provided.</div>
                        )}
                    </div>
                </div>

                <aside className="sidebar">
                    <div className="panel">
                        <h4 className="kicker" style={{ marginBottom: '12px' }}>SUBMITTED FILES ({demo.files?.length || 0})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {demo.files?.map((file, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveFile(file)}
                                    className={`file-item ${activeFile?.id === file.id ? 'active' : ''}`}
                                >
                                    <span style={{ fontSize: '18px' }}>{activeFile?.id === file.id ? '🔊' : '📁'}</span>
                                    <span style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.filename}</span>
                                        <span style={{ display: 'block', fontSize: '10px', color: '#666' }}>{(file.filesize / (1024 * 1024)).toFixed(2)} MB</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="panel" style={{ marginTop: '14px' }}>
                        <h4 className="kicker" style={{ marginBottom: '14px' }}>A&R DECISION</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <button
                                onClick={() => handleStatusUpdate('reviewing')}
                                disabled={processing}
                                style={{ ...btnStyle, background: demo.status === 'reviewing' ? 'rgba(245,158,11,0.14)' : 'transparent', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.35)', opacity: processing ? 0.5 : 1 }}
                            >
                                REVIEWING
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('pending')}
                                disabled={processing}
                                style={{ ...btnStyle, background: demo.status === 'pending' ? 'rgba(255,255,255,0.06)' : 'transparent', color: '#ddd', borderColor: 'rgba(255,255,255,0.12)', opacity: processing ? 0.5 : 1 }}
                            >
                                PENDING
                            </button>
                        </div>
                        <button
                            onClick={() => handleStatusUpdate('approved')}
                            disabled={processing}
                            style={{ ...btnStyle, background: demo.status === 'approved' ? 'rgba(209,213,219,0.18)' : 'transparent', color: '#d1d5db', borderColor: 'rgba(209,213,219,0.35)', marginBottom: '8px', opacity: processing ? 0.5 : 1 }}
                        >
                            {demo.status === 'approved' ? '✓ APPROVED' : 'APPROVE'}
                        </button>
                        <button
                            onClick={() => handleStatusUpdate('rejected')}
                            disabled={processing}
                            style={{ ...btnStyle, background: demo.status === 'rejected' ? 'rgba(239,68,68,0.18)' : 'transparent', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', opacity: processing ? 0.5 : 1 }}
                        >
                            {demo.status === 'rejected' ? '✖ REJECTED' : 'REJECT'}
                        </button>

                        {demo.status === 'approved' && (
                            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                                <Link href={`/dashboard/demo/${id}/finalize`} className="primary-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '12px 14px' }}>
                                    PROCEED TO FINALIZATION
                                </Link>
                                <p style={{ fontSize: '9px', color: '#555', textAlign: 'center', marginTop: '8px', letterSpacing: '0.8px' }}>
                                    Identity, financials and contract setup.
                                </p>
                            </div>
                        )}

                        {demo.reviewedBy && (
                            <p style={{ marginTop: '12px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
                                Last handled by <strong style={{ color: '#bbb' }}>{demo.reviewedBy}</strong>
                            </p>
                        )}

                        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
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
                                                .catch(() => showToast("Failed to delete demo", "error"));
                                        }
                                    );
                                }}
                                style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', fontWeight: 800, cursor: 'pointer', width: '100%' }}
                            >
                                DELETE RECORD
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .demo-review-shell {
                    max-width: 1240px;
                    margin: 0 auto;
                }
                .demo-review-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 22px;
                    gap: 12px;
                }
                .demo-review-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 360px;
                    gap: 18px;
                    align-items: start;
                }
                .sidebar {
                    position: sticky;
                    top: 24px;
                }
                .subtle-link {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.6px;
                    color: #8b8b8b;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                .chip {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: #777;
                    border: 1px solid var(--border);
                    border-radius: 999px;
                    padding: 6px 10px;
                    background: rgba(255,255,255,0.02);
                }
                .panel {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    padding: 22px;
                    box-shadow: 0 14px 36px rgba(0,0,0,0.32);
                }
                .hero-panel {
                    margin-bottom: 14px;
                }
                .artist-panel {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 14px;
                }
                .kicker {
                    margin: 0;
                    font-size: 10px;
                    letter-spacing: 2px;
                    font-weight: 800;
                    color: #666;
                }
                .title {
                    font-size: clamp(30px, 4vw, 46px);
                    margin: 10px 0 10px 0;
                    font-weight: 900;
                    letter-spacing: -0.8px;
                }
                .meta-row {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    color: #8b8b8b;
                    font-size: 12px;
                    font-weight: 600;
                    flex-wrap: wrap;
                }
                .message-box {
                    background: #101010;
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    padding: 18px;
                    white-space: pre-wrap;
                    color: #c9c9c9;
                    line-height: 1.7;
                    font-size: 14px;
                }
                .player-box {
                    background: #101010;
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    padding: 16px;
                }
                .file-item {
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid var(--border);
                    background: #101010;
                    color: #bbb;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .file-item:hover {
                    border-color: #3a3a3a;
                }
                .file-item.active {
                    border-color: #9ca3af;
                    background: #151515;
                    color: #fff;
                }
                .primary-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: transform .16s ease, opacity .16s ease;
                }
                .primary-btn:hover {
                    transform: translateY(-1px);
                    opacity: .92;
                }
                .secondary-btn {
                    border: 1px solid var(--border);
                    background: transparent;
                    color: #d1d5db;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                @media (max-width: 980px) {
                    .demo-review-grid {
                        grid-template-columns: 1fr;
                    }
                    .sidebar {
                        position: static;
                    }
                    .artist-panel {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
}
