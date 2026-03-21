"use client";
import { useState, useEffect, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/app/components/ToastContext';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import WaveformPlayer from '@/app/components/dashboard/WaveformPlayer';
import {
    canApproveDemos,
    canDeleteDemos,
    canFinalizeDemos,
    canRejectDemos,
    canReviewDemos,
    canViewAllDemos
} from '@/lib/permissions';
import { useMinimumLoader } from '@/lib/use-minimum-loader';


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
    const showLoading = useMinimumLoader(loading, 900);
    const [error, setError] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [artistNote, setArtistNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const canViewDemo = canViewAllDemos(session?.user);
    const canReviewDemo = canReviewDemos(session?.user);
    const canApproveDemo = canApproveDemos(session?.user);
    const canRejectDemo = canRejectDemos(session?.user);
    const canFinalizeDemo = canFinalizeDemos(session?.user);
    const canDeleteDemo = canDeleteDemos(session?.user);
    const isOwnDemo = demo && session?.user && demo.artist?.id === session.user.id;

    const fetchDemo = useCallback(async () => {
        try {
            const res = await fetch(`/api/demo/${id}`);
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setError(data?.error || "Access denied");
                return;
            }

            if (data) {
                setDemo(data);
                setArtistNote(data.artistNote || "");
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

    const handleStatusUpdate = async (status, reason = null) => {
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
                const data = await res.json().catch(() => null);
                showToast(data?.error || "Failed to update status", "error");
            }
        } catch (e) {
            showToast("Error updating status", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistNote })
            });
            if (res.ok) {
                const updated = await res.json();
                setDemo(updated);
                showToast("Note saved successfully", "success");
            } else {
                const data = await res.json().catch(() => null);
                showToast(data?.error || "Failed to save note", "error");
            }
        } catch {
            showToast("Error saving note", "error");
        } finally {
            setSavingNote(false);
        }
    };

    if (showLoading) {
        return <DashboardLoader fullScreen label="LOADING DEMO" subLabel="Fetching submission details and files..." />;
    }
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
                <Link href={isOwnDemo ? "/dashboard?view=my-demos" : "/dashboard?view=submissions"} className="subtle-link">
                    ← BACK TO {isOwnDemo ? "MY DEMOS" : "SUBMISSIONS"}
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
                        {demo.status === 'rejected' && demo.rejectionReason && (
                            <div className="rejection-card">
                                <div className="rejection-card-header">
                                    <div className="rejection-icon">✕</div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px', color: '#fca5a5' }}>REJECTION REASON</p>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#ef444480' }}>
                                            {demo.reviewedBy ? `by ${demo.reviewedBy}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#fee2e2', whiteSpace: 'pre-wrap' }}>{demo.rejectionReason}</p>
                            </div>
                        )}
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
                                <WaveformPlayer
                                    src={activeFileUrl}
                                    filename={activeFile.filename}
                                />
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

                    {canViewDemo ? (
                        <div className="panel" style={{ marginTop: '14px' }}>
                            <h4 className="kicker" style={{ marginBottom: '14px' }}>A&R DECISION</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                {canReviewDemo && (
                                    <>
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
                                    </>
                                )}
                            </div>
                            {canApproveDemo && (
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    disabled={processing}
                                    style={{ ...btnStyle, background: demo.status === 'approved' ? 'rgba(209,213,219,0.18)' : 'transparent', color: '#d1d5db', borderColor: 'rgba(209,213,219,0.35)', marginBottom: '8px', opacity: processing ? 0.5 : 1 }}
                                >
                                    {demo.status === 'approved' ? '✓ APPROVED' : 'APPROVE'}
                                </button>
                            )}
                            {canRejectDemo && (
                                <button
                                    onClick={() => {
                                        setRejectionReason(demo.rejectionReason || "");
                                        setShowRejectModal(true);
                                    }}
                                    disabled={processing}
                                    style={{ ...btnStyle, background: demo.status === 'rejected' ? 'rgba(239,68,68,0.18)' : 'transparent', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', opacity: processing ? 0.5 : 1 }}
                                >
                                    {demo.status === 'rejected' ? '✖ REJECTED' : 'REJECT'}
                                </button>
                            )}

                            {demo.rejectionReason && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    background: 'rgba(239,68,68,0.08)'
                                }}>
                                    <p style={{ margin: 0, marginBottom: '6px', fontSize: '9px', letterSpacing: '1px', fontWeight: 900, color: '#fca5a5' }}>REJECTION REASON</p>
                                    <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: '#fee2e2', whiteSpace: 'pre-wrap' }}>{demo.rejectionReason}</p>
                                </div>
                            )}

                            {demo.status === 'approved' && canFinalizeDemo && (
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

                            {canDeleteDemo && (
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
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="panel" style={{ marginTop: '14px' }}>
                                <h4 className="kicker" style={{ marginBottom: '14px' }}>STATUS</h4>
                                <div style={{
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: `1px solid ${getStatusColor(demo.status)}30`,
                                    background: `${getStatusColor(demo.status)}10`,
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: getStatusColor(demo.status) }}>
                                        {demo.status.toUpperCase()}
                                    </span>
                                </div>

                                {demo.rejectionReason && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        background: 'rgba(239,68,68,0.08)'
                                    }}>
                                        <p style={{ margin: 0, marginBottom: '6px', fontSize: '9px', letterSpacing: '1px', fontWeight: 900, color: '#fca5a5' }}>REJECTION REASON</p>
                                        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: '#fee2e2', whiteSpace: 'pre-wrap' }}>{demo.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="panel" style={{ marginTop: '14px' }}>
                                <h4 className="kicker" style={{ marginBottom: '12px' }}>YOUR NOTE</h4>
                                <textarea
                                    value={artistNote}
                                    onChange={(e) => setArtistNote(e.target.value)}
                                    placeholder="Add a note about this demo..."
                                    rows={4}
                                    disabled={savingNote}
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                        minHeight: '90px',
                                        lineHeight: '1.5',
                                        marginBottom: '10px'
                                    }}
                                />
                                <button
                                    onClick={handleSaveNote}
                                    disabled={savingNote || artistNote === (demo.artistNote || "")}
                                    className="primary-btn"
                                    style={{
                                        width: '100%',
                                        padding: '11px',
                                        fontSize: '10px',
                                        opacity: savingNote || artistNote === (demo.artistNote || "") ? 0.5 : 1
                                    }}
                                >
                                    {savingNote ? 'SAVING...' : 'SAVE NOTE'}
                                </button>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                <button
                                    onClick={() => {
                                        showConfirm(
                                            "DELETE DEMO?",
                                            "Are you sure you want to permanently delete this demo? This action cannot be undone.",
                                            () => {
                                                fetch(`/api/demo/${id}`, { method: 'DELETE' })
                                                    .then(() => {
                                                        showToast("Demo deleted successfully", "success");
                                                        router.push('/dashboard?view=my-demos');
                                                    })
                                                    .catch(() => showToast("Failed to delete demo", "error"));
                                            }
                                        );
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'rgba(255,0,0,0.05)',
                                        color: '#ef4444',
                                        borderColor: 'rgba(239,68,68,0.2)',
                                        textAlign: 'center'
                                    }}
                                >
                                    DELETE DEMO
                                </button>
                            </div>
                        </>
                    )}
                </aside>
            </div>

            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="reject-modal-backdrop"
                        onClick={() => !processing && setShowRejectModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className="reject-modal-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="kicker" style={{ marginBottom: '8px' }}>REJECTION REASON</p>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>Reason visible to artist</h3>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Write a clear rejection reason..."
                                rows={5}
                                className="reject-textarea"
                                disabled={processing}
                            />
                            <div className="reject-modal-actions">
                                <button
                                    className="secondary-btn"
                                    style={{ padding: '10px 12px', fontSize: '10px', background: 'transparent', cursor: processing ? 'not-allowed' : 'pointer' }}
                                    onClick={() => setShowRejectModal(false)}
                                    disabled={processing}
                                >
                                    CANCEL
                                </button>
                                <button
                                    className="primary-btn"
                                    style={{ padding: '10px 12px', fontSize: '10px', border: 'none' }}
                                    disabled={processing || !rejectionReason.trim()}
                                    onClick={async () => {
                                        const reason = rejectionReason.trim();
                                        if (!reason) return;
                                        await handleStatusUpdate('rejected', reason);
                                        setShowRejectModal(false);
                                    }}
                                >
                                    {processing ? "SAVING..." : "REJECT DEMO"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                .reject-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.62);
                    backdrop-filter: blur(3px);
                    display: grid;
                    place-items: center;
                    z-index: 200;
                    padding: 18px;
                }
                .reject-modal-card {
                    width: 100%;
                    max-width: 560px;
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    background: #0e0e0e;
                    box-shadow: 0 26px 70px rgba(0,0,0,0.45);
                    padding: 18px;
                }
                .reject-textarea {
                    width: 100%;
                    border-radius: 10px;
                    border: 1px solid var(--border);
                    background: #121212;
                    color: #f3f4f6;
                    font-size: 13px;
                    line-height: 1.5;
                    padding: 12px;
                    resize: vertical;
                    min-height: 110px;
                    outline: none;
                    margin-bottom: 14px;
                }
                .reject-textarea:focus {
                    border-color: #6b7280;
                }
                .reject-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                .rejection-card {
                    margin-top: 18px;
                    padding: 18px;
                    border-radius: 12px;
                    border: 1px solid rgba(239,68,68,0.25);
                    background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04));
                    position: relative;
                    overflow: hidden;
                }
                .rejection-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #ef4444, transparent);
                    opacity: 0.5;
                }
                .rejection-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .rejection-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(239,68,68,0.15);
                    color: #ef4444;
                    display: grid;
                    place-items: center;
                    font-size: 14px;
                    font-weight: 900;
                    flex-shrink: 0;
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
