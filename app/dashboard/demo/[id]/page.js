"use client";
import { useState, useEffect, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Button, Chip, TextArea, Alert, Modal, ToggleButtonGroup, ToggleButton } from '@heroui/react';
import { useToast } from '@/app/components/ToastContext';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import WaveformPlayer from '@/app/components/dashboard/WaveformPlayer';
import DemoVersionHistory from '@/app/components/dashboard/primitives/DemoVersionHistory';
import {
    canApproveDemos,
    canDeleteDemos,
    canRejectDemos,
    canReviewDemos,
    canViewAllDemos
} from '@/lib/permissions';
import { useMinimumLoader } from '@/lib/use-minimum-loader';

const STATUS_COLOR_MAP = {
    approved: 'success',
    rejected: 'danger',
    reviewing: 'warning',
    pending: 'default',
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
        return <DashboardLoader label="LOADING DEMO" subLabel="Fetching submission details and files..." />;
    }
    if (error || !demo) return (
        <div className="flex flex-col items-center justify-center p-10 gap-4">
            <h2 className="text-xl font-bold">ERROR: {error || "Demo not found"}</h2>
            <NextLink href="/dashboard" className="demo-back-link">
                GO BACK
            </NextLink>
        </div>
    );

    const activeFileDownloadUrl = activeFile ? `/api/files/demo/${activeFile.id}` : null;
    const activeFileAudioUrl = activeFile ? `/api/files/demo/${activeFile.id}/audio` : null;
    const activeFileWaveformUrl = activeFile ? `/api/files/demo/${activeFile.id}/waveform` : null;
    const reviewStageSelection = ['pending', 'reviewing'].includes(String(demo.status || ''))
        ? [demo.status]
        : [];

    return (
        <div className="demo-review-page max-w-[1320px] mx-auto">
            {/* Header */}
            <div className="dash-page-hdr">
                <NextLink
                    href={isOwnDemo ? "/dashboard?view=my-demos" : "/dashboard?view=submissions"}
                    className="demo-back-link"
                >
                    ← BACK TO {isOwnDemo ? "MY DEMOS" : "SUBMISSIONS"}
                </NextLink>
                <div className="demo-status-group">
                    <Chip variant="secondary" size="sm">ID: {demo.id.substring(0, 8)}</Chip>
                    <Chip variant="soft" size="sm" color={STATUS_COLOR_MAP[demo.status] || 'default'}>
                        {demo.status.toUpperCase()}
                    </Chip>
                </div>
            </div>

            {/* Main Grid */}
            <div className="dash-two-col">
                {/* Left Column */}
                <div className="demo-main-column flex flex-col gap-4">
                    {/* Demo Review Card */}
                    <Card className="demo-card">
                        <Card.Header className="demo-card-header">
                            <Card.Description className="demo-card-kicker">DEMO REVIEW</Card.Description>
                            <Card.Title className="demo-title">{demo.title}</Card.Title>
                        </Card.Header>
                        <Card.Content className="demo-card-content">
                            <div className="demo-meta-row">
                                <span className="demo-meta-pill">{demo.genre || 'Unknown Genre'}</span>
                                <span className="demo-meta-divider">•</span>
                                <span className="demo-meta-text">{new Date(demo.createdAt).toLocaleDateString()} {new Date(demo.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {demo.status === 'rejected' && demo.rejectionReason && (
                                <Alert status="danger" className="mt-4">
                                    <Alert.Indicator />
                                    <Alert.Content>
                                        <Alert.Title>REJECTION REASON</Alert.Title>
                                        <Alert.Description>
                                            {demo.reviewedBy && (
                                                <span className="text-[10px] opacity-50 block mb-1">by {demo.reviewedBy}</span>
                                            )}
                                            <span className="whitespace-pre-wrap">{demo.rejectionReason}</span>
                                        </Alert.Description>
                                    </Alert.Content>
                                </Alert>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Artist Profile Card */}
                    <Card className="demo-card">
                        <Card.Content className="demo-artist-card">
                            <div className="demo-artist-copy">
                                <p className="demo-card-kicker m-0">ARTIST PROFILE</p>
                                <h2 className="demo-artist-name">{demo.artist?.stageName || 'Anonymous'}</h2>
                                <p className="demo-artist-email">{demo.artist?.email}</p>
                            </div>
                            {demo.artist?.spotifyUrl && (
                                <a
                                    href={demo.artist.spotifyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="demo-link-button"
                                >
                                    SPOTIFY PROFILE
                                </a>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Message Card */}
                    <Card className="demo-card">
                        <Card.Header className="demo-card-header">
                            <Card.Title className="demo-card-kicker">MESSAGE FROM ARTIST</Card.Title>
                        </Card.Header>
                        <Card.Content className="demo-card-content">
                            <div className="demo-message-box">
                                {demo.message || "The artist did not include a message with this submission."}
                            </div>
                        </Card.Content>
                    </Card>

                    {/* Waveform Player Card */}
                    <Card className="demo-card">
                        <Card.Header className="demo-card-header">
                            <Card.Title className="demo-card-kicker">WAVEFORM PLAYER</Card.Title>
                        </Card.Header>
                        <Card.Content className="demo-card-content">
                            {activeFile ? (
                                <div>
                                    <WaveformPlayer
                                        src={activeFileAudioUrl}
                                        waveformUrl={activeFileWaveformUrl}
                                        filename={activeFile.filename}
                                    />
                                    <div className="demo-link-row">
                                        <a
                                            href={`${activeFileDownloadUrl}?download=1`}
                                            download
                                            className="demo-link-button demo-link-button-secondary"
                                        >
                                            DOWNLOAD SOURCE FILE
                                        </a>
                                    </div>
                                </div>
                            ) : demo.trackLink ? (
                                <div className="demo-empty-state">
                                    <p className="text-[13px] text-default-400 mb-4">This submission is hosted on an external platform.</p>
                                    <a
                                        href={demo.trackLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="demo-link-button"
                                    >
                                        OPEN EXTERNAL LINK
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center p-9 text-default-400">No audio data provided.</div>
                            )}
                        </Card.Content>
                    </Card>
                </div>

                {/* Sidebar */}
                <aside className="dash-aside demo-sidebar-column">
                    {/* Submitted Files */}
                    <Card className="demo-card">
                        <Card.Header className="demo-sidebar-header">
                            <div className="demo-sidebar-heading-row">
                                <p className="demo-sidebar-heading">SUBMITTED FILES</p>
                                <span className="demo-sidebar-count">{demo.files?.length || 0}</span>
                            </div>
                            <p className="demo-sidebar-subheading">Select the active source file</p>
                        </Card.Header>
                        <Card.Content className="flex flex-col gap-2">
                            {demo.files?.map((file, idx) => (
                                <Button
                                    key={idx}
                                    onPress={() => setActiveFile(file)}
                                    variant={activeFile?.id === file.id ? 'outline' : 'ghost'}
                                    className="demo-file-button"
                                >
                                    <span className="text-lg">{activeFile?.id === file.id ? '🔊' : '📁'}</span>
                                    <span className="flex-1 overflow-hidden text-left">
                                        <span className="block text-xs font-extrabold whitespace-nowrap text-ellipsis overflow-hidden">{file.filename}</span>
                                        <span className="block text-[10px] text-default-400">{(file.filesize / (1024 * 1024)).toFixed(2)} MB</span>
                                    </span>
                                </Button>
                            ))}
                        </Card.Content>
                    </Card>

                    {canViewDemo ? (
                      <>
                        <Card className="demo-card mt-4">
                            <Card.Header className="demo-sidebar-header">
                                <div className="demo-sidebar-heading-row">
                                    <p className="demo-sidebar-heading">A&R DECISION</p>
                                    <span className="demo-sidebar-count demo-sidebar-count-accent">{String(demo.status || 'pending').toUpperCase()}</span>
                                </div>
                                <p className="demo-sidebar-subheading">Move the review stage or finalize the outcome.</p>
                            </Card.Header>
                            <Card.Content className="demo-decision-stack">
                                {canReviewDemo && (
                                    <div className="demo-decision-section">
                                        <p className="demo-decision-label">REVIEW STAGE</p>
                                        <ToggleButtonGroup
                                            fullWidth
                                            selectionMode="single"
                                            selectedKeys={reviewStageSelection}
                                            className="demo-review-stage-toggle"
                                            onSelectionChange={(keys) => {
                                                const nextStage = Array.from(keys || [])[0];
                                                if (!nextStage || nextStage === demo.status) return;
                                                handleStatusUpdate(nextStage);
                                            }}
                                        >
                                            <ToggleButton
                                                id="reviewing"
                                                isDisabled={processing}
                                                className="demo-review-stage-button"
                                            >
                                                REVIEWING
                                            </ToggleButton>
                                            <ToggleButton
                                                id="pending"
                                                isDisabled={processing}
                                                className="demo-review-stage-button"
                                            >
                                                <ToggleButtonGroup.Separator />
                                                PENDING
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </div>
                                )}
                                {(canApproveDemo || canRejectDemo) && (
                                    <div className="demo-decision-section">
                                        <p className="demo-decision-label">FINAL ACTION</p>
                                        {canApproveDemo && (
                                            <Button
                                                onPress={() => handleStatusUpdate('approved')}
                                                isDisabled={processing}
                                                variant="primary"
                                                fullWidth
                                                size="md"
                                                className="demo-action-button"
                                            >
                                                {demo.status === 'approved' ? 'APPROVED' : 'APPROVE'}
                                            </Button>
                                        )}
                                        {canRejectDemo && (
                                            <Button
                                                onPress={() => {
                                                    setRejectionReason(demo.rejectionReason || "");
                                                    setShowRejectModal(true);
                                                }}
                                                isDisabled={processing}
                                                variant={demo.status === 'rejected' ? 'danger' : 'danger-soft'}
                                                fullWidth
                                                size="md"
                                                className="demo-action-button"
                                            >
                                                {demo.status === 'rejected' ? 'REJECTED' : 'REJECT'}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {demo.rejectionReason && (
                                    <Alert status="danger" className="mt-2">
                                        <Alert.Indicator />
                                        <Alert.Content>
                                            <Alert.Title>REJECTION REASON</Alert.Title>
                                            <Alert.Description className="whitespace-pre-wrap">{demo.rejectionReason}</Alert.Description>
                                        </Alert.Content>
                                    </Alert>
                                )}

                                {demo.reviewedBy && (
                                    <p className="mt-3 text-[10px] text-default-400 text-center">
                                        Last handled by <strong className="text-default-300">{demo.reviewedBy}</strong>
                                    </p>
                                )}

                                {canDeleteDemo && (
                                    <div className="demo-danger-zone">
                                        <p className="demo-decision-label demo-decision-label-danger">DANGER ZONE</p>
                                        <Button
                                            onPress={() => {
                                                showConfirm(
                                                    "Delete Record?",
                                                    "Are you absolutely sure you want to permanently delete this demo? This action is irreversible.",
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
                                            variant="danger"
                                            size="md"
                                            fullWidth
                                            className="demo-delete-button"
                                        >
                                            DELETE RECORD
                                        </Button>
                                    </div>
                                )}
                            </Card.Content>
                        </Card>
                    {/* Version History - Admin */}
                        <Card className="demo-card mt-4">
                            <Card.Header className="demo-sidebar-header">
                                <div className="demo-sidebar-heading-row">
                                    <p className="demo-sidebar-heading">VERSION HISTORY</p>
                                </div>
                                <p className="demo-sidebar-subheading">Previous revisions of this demo.</p>
                            </Card.Header>
                            <Card.Content>
                                <DemoVersionHistory demoId={id} canRestore={true} onRestore={fetchDemo} />
                            </Card.Content>
                        </Card>
                      </>
                    ) : (
                        <>
                            {/* Status Card */}
                            <Card className="demo-card mt-4">
                                <Card.Header className="demo-card-header">
                                    <Card.Title className="demo-card-kicker">STATUS</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    <div className="text-center">
                                        <Chip
                                            variant="soft"
                                            color={STATUS_COLOR_MAP[demo.status] || 'default'}
                                            size="lg"
                                            className="text-xs font-black tracking-[2px]"
                                        >
                                            {demo.status.toUpperCase()}
                                        </Chip>
                                    </div>

                                    {demo.rejectionReason && (
                                        <Alert status="danger" className="mt-3">
                                            <Alert.Indicator />
                                            <Alert.Content>
                                                <Alert.Title>REJECTION REASON</Alert.Title>
                                                <Alert.Description className="whitespace-pre-wrap">{demo.rejectionReason}</Alert.Description>
                                            </Alert.Content>
                                        </Alert>
                                    )}
                                </Card.Content>
                            </Card>

                            {/* Artist Note Card */}
                            <Card className="demo-card mt-4">
                                <Card.Header className="demo-card-header">
                                    <Card.Title className="demo-card-kicker">YOUR NOTE</Card.Title>
                                </Card.Header>
                                <Card.Content className="flex flex-col gap-3">
                                    <TextArea
                                        value={artistNote}
                                        onChange={(e) => setArtistNote(e.target.value)}
                                        placeholder="Add a note about this demo..."
                                        isDisabled={savingNote}
                                        className="min-h-30"
                                        aria-label="Your note"
                                    />
                                    <Button
                                        onPress={handleSaveNote}
                                        isDisabled={savingNote || artistNote === (demo.artistNote || "")}
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                    >
                                        {savingNote ? 'SAVING...' : 'SAVE NOTE'}
                                    </Button>
                                </Card.Content>
                            </Card>

                            {/* Version History - Artist (read-only) */}
                            <Card className="demo-card mt-4">
                                <Card.Header className="demo-sidebar-header">
                                    <div className="demo-sidebar-heading-row">
                                        <p className="demo-sidebar-heading">VERSION HISTORY</p>
                                    </div>
                                    <p className="demo-sidebar-subheading">Previous revisions of this demo.</p>
                                </Card.Header>
                                <Card.Content>
                                    <DemoVersionHistory demoId={id} canRestore={false} />
                                </Card.Content>
                            </Card>

                            {/* Delete Button */}
                            <div className="mt-4">
                                <Button
                                    onPress={() => {
                                        showConfirm(
                                            "Delete Demo?",
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
                                    variant="danger"
                                    fullWidth
                                    size="md"
                                    className="font-semibold"
                                >
                                    Delete Demo
                                </Button>
                            </div>
                        </>
                    )}
                </aside>
            </div>

            {/* Reject Modal */}
            <Modal isOpen={showRejectModal} onOpenChange={(open) => !processing && setShowRejectModal(open)}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="sm:max-w-[560px]">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>Rejection Reason</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-sm text-default-400 mb-3">This reason will be visible to the artist.</p>
                                <TextArea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Write a clear rejection reason..."
                                    isDisabled={processing}
                                    className="min-h-40 w-full"
                                    aria-label="Rejection reason"
                                />
                            </Modal.Body>
                            <Modal.Footer className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    size="md"
                                    onPress={() => setShowRejectModal(false)}
                                    isDisabled={processing}
                                    className="font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    size="md"
                                    isDisabled={processing || !rejectionReason.trim()}
                                    onPress={async () => {
                                        const reason = rejectionReason.trim();
                                        if (!reason) return;
                                        await handleStatusUpdate('rejected', reason);
                                        setShowRejectModal(false);
                                    }}
                                    className="font-semibold"
                                >
                                    {processing ? "Saving..." : "Reject Demo"}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            <style jsx>{`
                .demo-review-page {
                    width: 100%;
                    padding-bottom: 24px;
                    padding-inline: 16px;
                    min-width: 0;
                }
                .demo-back-link {
                    color: #8b8b8b;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.6px;
                    min-height: 44px;
                    transition: color 0.2s ease, transform 0.2s ease;
                }
                .demo-back-link:hover {
                    color: #d4d4d8;
                    transform: translateX(-2px);
                }
                .demo-status-group {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                    min-width: 0;
                }
                .demo-main-column,
                .demo-sidebar-column {
                    min-width: 0;
                }
                .demo-card {
                    overflow: hidden;
                    min-width: 0;
                }
                .demo-card-header {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                .demo-card-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .demo-sidebar-header {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    align-items: stretch;
                }
                .demo-sidebar-heading-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    min-width: 0;
                }
                .demo-sidebar-heading {
                    margin: 0;
                    font-size: 10px;
                    font-weight: 950;
                    letter-spacing: 2.6px;
                    text-transform: uppercase;
                    color: #8f8f96;
                }
                .demo-sidebar-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 28px;
                    height: 24px;
                    padding: 0 9px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.04);
                    color: #f5f5f5;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    line-height: 1;
                }
                .demo-sidebar-count-accent {
                    color: #8dc2ff;
                }
                .demo-sidebar-subheading {
                    margin: 0;
                    font-size: 11px;
                    line-height: 1.5;
                    color: #686870;
                }
                .demo-card-kicker {
                    margin: 0;
                    color: var(--text-muted, #8b8b8b);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                .demo-title {
                    margin: 0;
                    font-size: clamp(28px, 5vw, 52px);
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    line-height: 1;
                    text-wrap: balance;
                }
                .demo-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    color: #8b8b8b;
                }
                .demo-meta-pill {
                    padding: 6px 10px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    font-size: 11px;
                    font-weight: 700;
                    color: #d4d4d8;
                }
                .demo-meta-divider {
                    opacity: 0.5;
                    font-size: 12px;
                }
                .demo-meta-text {
                    font-size: 12px;
                    font-weight: 600;
                }
                .demo-artist-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .demo-artist-copy {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .demo-artist-name {
                    margin: 0;
                    font-size: clamp(20px, 3vw, 30px);
                    font-weight: 900;
                    line-height: 1;
                }
                .demo-artist-email {
                    margin: 0;
                    font-size: 13px;
                    color: #777;
                    word-break: break-all;
                }
                .demo-message-box {
                    white-space: pre-wrap;
                    border-radius: 16px;
                    border: 1px solid var(--ds-item-border);
                    background: var(--ds-item-bg);
                    padding: 18px;
                    color: var(--ds-text-sub);
                    line-height: 1.8;
                    font-size: 14px;
                }
                .demo-link-row {
                    display: flex;
                    justify-content: center;
                    margin-top: 16px;
                    width: 100%;
                }
                .demo-link-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    min-height: 44px;
                    padding: 0 20px;
                    border-radius: 999px;
                    border: 1px solid var(--ds-glass-border);
                    background: var(--ds-text);
                    color: var(--background);
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    max-width: 100%;
                    text-align: center;
                }
                .demo-link-button:hover {
                    transform: translateY(-1px);
                    opacity: 0.88;
                }
                .demo-link-button-secondary {
                    background: var(--ds-item-bg);
                    border-color: var(--ds-item-border-hover);
                    color: var(--ds-text-sub);
                }
                .demo-link-button-secondary:hover {
                    background: var(--ds-item-bg-hover);
                }
                .demo-empty-state {
                    text-align: center;
                    border: 1px dashed rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 20px;
                }
                .demo-file-button {
                    width: 100%;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 12px;
                    height: auto;
                    min-height: 62px;
                    padding: 14px 16px;
                    border-radius: 18px;
                    min-width: 0;
                }
                .demo-decision-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    min-width: 0;
                }
                .demo-decision-section {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .demo-decision-label {
                    margin: 0;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 2.2px;
                    text-transform: uppercase;
                    color: #6e6e76;
                }
                .demo-review-stage-toggle {
                    width: 100%;
                }
                .demo-review-stage-button {
                    min-height: 48px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1.2px;
                }
                .demo-review-stage-button[data-selected="true"] {
                    color: #f5f5f5;
                }
                .demo-action-button {
                    min-height: 52px;
                    border-radius: 18px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1.2px;
                }
                .demo-danger-zone {
                    margin-top: 2px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .demo-decision-label-danger {
                    color: #8a7373;
                }
                .demo-delete-button {
                    min-height: 48px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1.2px;
                }

                @media (max-width: 640px) {
                    .demo-review-page {
                        padding-bottom: 16px;
                        padding-inline: 12px;
                    }
                    .demo-status-group {
                        justify-content: flex-start;
                        width: 100%;
                    }
                    .demo-artist-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .demo-sidebar-heading-row {
                        align-items: flex-start;
                    }
                    .demo-title {
                        font-size: clamp(22px, 8vw, 34px);
                    }
                    .demo-meta-row {
                        gap: 8px;
                    }
                    .demo-meta-divider {
                        display: none;
                    }
                    .demo-card-content {
                        gap: 14px;
                    }
                    .demo-link-button {
                        width: 100%;
                        padding-inline: 16px;
                    }
                    .demo-link-row {
                        margin-top: 12px;
                    }
                    .demo-file-button {
                        padding: 12px 14px;
                        border-radius: 16px;
                    }
                    .demo-decision-section {
                        gap: 8px;
                    }
                }

                @media (max-width: 420px) {
                    .demo-review-page {
                        padding-inline: 10px;
                    }
                    .demo-back-link {
                        font-size: 9px;
                        letter-spacing: 1.2px;
                    }
                    .demo-title {
                        font-size: 22px;
                    }
                    .demo-artist-name {
                        font-size: 18px;
                    }
                    .demo-message-box {
                        padding: 14px;
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
}
