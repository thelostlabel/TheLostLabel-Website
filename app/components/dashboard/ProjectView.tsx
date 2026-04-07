"use client";
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/app/components/ToastContext';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import {
    CheckCircle, Clock, FileText, Music, Upload,
    Calendar, ArrowLeft, Play, Pause, LucideIcon
} from 'lucide-react';
import { Card, Button, TextField, Label, Input } from '@heroui/react';
import ContractSigningModal from './ContractSigningModal';
import DashboardLoader from './DashboardLoader';

interface Stage {
    id: string;
    label: string;
    icon: LucideIcon;
}

const stages: Stage[] = [
    { id: 'demo', label: 'DEMO SUBMITTED', icon: Music },
    { id: 'review', label: 'IN REVIEW', icon: Clock },
    { id: 'deal', label: 'DEAL OFFERED', icon: FileText },
    { id: 'signing', label: 'SIGNING', icon: FileText },
    { id: 'production', label: 'PRODUCTION', icon: Upload },
    { id: 'scheduled', label: 'SCHEDULED', icon: Calendar },
    { id: 'live', label: 'RELEASED', icon: CheckCircle }
];

interface DemoFile {
    id: string;
    filename: string;
    filesize: number;
}

interface Contract {
    id: string;
    status?: string;
    signedAt?: string;
    artistShare?: number | string;
    labelShare?: number | string;
    releaseId?: string;
    release?: { image?: string };
}

interface Project {
    id: string;
    title: string;
    status: string;
    files?: DemoFile[];
    trackLink?: string;
    contract?: Contract;
    scheduledReleaseDate?: string;
}

interface ProjectViewProps {
    projectId: string | null;
    onBack: () => void;
    user: {
        legalName?: string;
        phoneNumber?: string;
        address?: string;
    } | null;
}

export default function ProjectView({ projectId, onBack, user }: ProjectViewProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSignModal, setShowSignModal] = useState(false);

    const [playing, setPlaying] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!projectId || projectId === 'null' || projectId === 'undefined') {
            setProject(null);
            setLoading(false);
            return;
        }
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
        return () => { if (audio) audio.pause(); };
    }, [projectId, refreshTrigger, audio]);

    const handlePlay = (url: string) => {
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

    const getCurrentStageIndex = (p: Project | null): number => {
        if (!p) return 0;
        if (p.status === 'pending' || p.status === 'reviewing') return 1;
        if (p.status === 'rejected') return 1;
        if (p.status === 'approved') return 2;
        if (p.status === 'contract_sent') return 3;
        const isSigned = p.contract?.status === 'active' || p.contract?.signedAt;
        if (isSigned) {
            if (p.scheduledReleaseDate) {
                return new Date(p.scheduledReleaseDate) <= new Date() ? 6 : 5;
            }
            return 4;
        }
        return 0;
    };

    if (loading) return <DashboardLoader label="LOADING PROJECT" subLabel="Gathering project timeline and files..." />;
    if (!projectId || projectId === 'null' || projectId === 'undefined') {
        return <div className="py-12 text-center ds-text-muted text-sm">Select a demo from MY DEMOS to open project details.</div>;
    }
    if (!project) return <div className="py-12 text-center text-danger text-sm font-bold">PROJECT NOT FOUND</div>;

    const currentStageIndex = getCurrentStageIndex(project);
    const demoFileUrl = project.files?.[0] ? `/api/files/demo/${project.files[0].id}` : null;
    const progress = (currentStageIndex / (stages.length - 1)) * 100;

    return (
        <div className="flex flex-col gap-8 max-w-[1000px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-5">
                <Button isIconOnly variant="ghost" onPress={onBack} aria-label="Go back">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">{project.title}</h1>
                    <div className="flex gap-2.5 items-center mt-1">
                        <span className="text-[11px] text-accent tracking-widest font-extrabold">
                            {stages[currentStageIndex].label}
                        </span>
                        <span className="text-[11px] ds-text-faint">•</span>
                        <span className="text-[11px] ds-text-muted">ID: {project.id.slice(0, 8)}</span>
                    </div>
                </div>
            </div>

            {/* Audio Player */}
            {(project.files?.[0] || project.trackLink) && (
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onPress={() => handlePlay(demoFileUrl || project.trackLink || '')}
                    >
                        {playing ? <Pause size={14} /> : <Play size={14} />}
                        {playing ? 'PAUSE RECORDING' : 'PLAY RECORDING'}
                    </Button>
                    {playing && (
                        <div className="flex gap-[3px] items-center h-3.5">
                            <motion.div animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[3px] bg-accent rounded-sm" />
                            <motion.div animate={{ height: [8, 14, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[3px] bg-accent rounded-sm" />
                            <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-[3px] bg-accent rounded-sm" />
                        </div>
                    )}
                </div>
            )}

            {/* Timeline Stepper */}
            <Card className="p-8 relative overflow-visible">
                <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-default/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-accent shadow-[0_0_10px_var(--accent)]"
                    />
                </div>
                <div className="flex justify-between relative">
                    {stages.map((stage, index) => {
                        const isActive = index === currentStageIndex;
                        const isPast = index < currentStageIndex;
                        const Icon = stage.icon;
                        return (
                            <div key={stage.id} className="flex flex-col items-center gap-2.5 z-[2]">
                                <motion.div
                                    animate={{
                                        backgroundColor: isActive || isPast ? 'var(--status-success)' : 'var(--ds-item-bg)',
                                        borderColor: isActive ? 'var(--status-success)' : 'var(--ds-item-border)',
                                        scale: isActive ? 1.2 : 1
                                    }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                                >
                                    <Icon size={16} className={isActive || isPast ? 'text-black' : 'ds-text-faint'} />
                                </motion.div>
                                <div className={`text-[9px] font-black tracking-wider ${isActive ? 'ds-text' : 'ds-text-faint'}`}>
                                    {stage.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Dynamic Stage Content */}
            <motion.div key={currentStageIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Review */}
                {currentStageIndex === 1 && (
                    <Card className="py-12 text-center">
                        <Card.Content className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-default/5 flex items-center justify-center">
                                <Clock size={32} className="ds-text-faint" />
                            </div>
                            <h2 className="text-xl font-extrabold">IN REVIEW</h2>
                            <p className="text-xs ds-text-muted max-w-[400px] leading-relaxed">
                                Our A&R team is currently listening to your demo. You will be notified via email once a decision has been made.
                            </p>
                        </Card.Content>
                    </Card>
                )}

                {/* Deal Offered */}
                {currentStageIndex === 2 && (
                    <Card className="py-12 text-center bg-[radial-gradient(circle_at_top,rgba(0,255,136,0.05)_0%,transparent_70%)]">
                        <Card.Content className="flex flex-col items-center gap-4">
                            <h2 className="text-3xl font-black">CONGRATULATIONS!</h2>
                            <p className="text-[13px] text-[var(--status-success)] tracking-widest font-black">WE WANT TO SIGN THIS TRACK</p>
                            <p className="text-xs ds-text-muted max-w-[500px] leading-relaxed mt-4">
                                Our team is preparing the contract details. You will receive a notification when the official agreement is ready for your signature.
                            </p>
                        </Card.Content>
                    </Card>
                )}

                {/* Signing */}
                {currentStageIndex === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-8">
                            <h3 className="text-base font-black mb-5">OFFICIAL AGREEMENT</h3>
                            <div className="flex items-center justify-between p-5 bg-default/5 rounded-lg mb-6">
                                <div>
                                    <div className="text-xs font-extrabold">Recording Agreement</div>
                                    <div className="text-[10px] ds-text-muted">Standard Exclusive License</div>
                                </div>
                                <FileText size={20} className="ds-text-faint" />
                            </div>
                            <div className="flex flex-col gap-4">
                                {[
                                    ['ARTIST SHARE', `${Math.round((Number(project.contract?.artistShare) || 0) * 100)}%`],
                                    ['LABEL SHARE', `${Math.round((Number(project.contract?.labelShare) || 0) * 100)}%`],
                                    ['TERM', 'Perpetual'],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between text-[11px]">
                                        <span className="ds-text-muted">{label}</span>
                                        <span className="font-extrabold">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card className="p-8 flex flex-col justify-center items-center">
                            <p className="text-xs ds-text-muted text-center mb-8 leading-relaxed">
                                Please review the terms and sign the agreement to proceed to the production phase.
                            </p>
                            <Button variant="primary" onPress={() => setShowSignModal(true)}>
                                REVIEW & SIGN
                            </Button>
                        </Card>
                    </div>
                )}

                {/* Production */}
                {currentStageIndex === 4 && (
                    <ProductionView project={project} onUpdate={() => setRefreshTrigger(prev => prev + 1)} />
                )}

                {/* Scheduled */}
                {currentStageIndex === 5 && (
                    <Card className="py-12 text-center">
                        <Card.Content className="flex flex-col items-center gap-2">
                            <h2 className="text-2xl font-black">RELEASE SCHEDULED</h2>
                            <div className="text-5xl font-black text-accent my-5 tracking-tight">
                                {new Date(project.scheduledReleaseDate!).toLocaleDateString()}
                            </div>
                            <p className="text-[11px] tracking-widest ds-text-muted">DISTRIBUTION IN PROGRESS</p>
                        </Card.Content>
                    </Card>
                )}

                {/* Released */}
                {currentStageIndex === 6 && (
                    <Card className="py-12 text-center">
                        <Card.Content className="flex flex-col items-center gap-4">
                            <h2 className="text-2xl font-black">RELEASED</h2>
                            <p className="text-xs ds-text-muted">This track is live on all platforms.</p>
                            <Button variant="secondary" onPress={onBack} className="mt-4">
                                VIEW ANALYTICS (Overview)
                            </Button>
                        </Card.Content>
                    </Card>
                )}
            </motion.div>

            {/* Sign Modal */}
            {showSignModal && (
                <ContractSigningModal
                    contract={project.contract!}
                    user={user}
                    onClose={() => setShowSignModal(false)}
                    onComplete={() => {
                        setShowSignModal(false);
                        setRefreshTrigger(p => p + 1);
                    }}
                />
            )}
        </div>
    );
}

interface ProductionViewProps {
    project: Project;
    onUpdate: () => void;
}

function ProductionView({ project, onUpdate }: ProductionViewProps) {
    const { showToast } = useToast();
    const [date, setDate] = useState(project.scheduledReleaseDate ? project.scheduledReleaseDate.split('T')[0] : '');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingArt, setUploadingArt] = useState(false);
    const [coverArt, setCoverArt] = useState<string | null>(project.contract?.release?.image || null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (coverArtPreview?.startsWith('blob:')) URL.revokeObjectURL(coverArtPreview);
        };
    }, [coverArtPreview]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadArtwork(file);
    };

    const uploadArtwork = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file (JPG, PNG)', 'error');
            return;
        }
        setUploadingArt(true);
        const formData = new FormData();
        formData.append('files', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.files?.[0]) {
                setCoverArt(data.files[0].filepath);
                setCoverArtPreview((current) => {
                    if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
                    return URL.createObjectURL(file);
                });
            } else {
                showToast('Upload failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Upload failed', 'error');
        } finally {
            setUploadingArt(false);
        }
    };

    const handleSave = async () => {
        if (!date) { showToast('Please select a release date', 'warning'); return; }
        if (!coverArt) { showToast('Please upload cover art', 'warning'); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/demo/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduledReleaseDate: date, coverArtUrl: coverArt })
            });
            if (res.ok) onUpdate();
            else showToast('Failed to submit', 'error');
        } catch { showToast('Failed to save', 'error'); }
        finally { setSubmitting(false); }
    };

    const coverArtSrc = coverArtPreview || (
        typeof coverArt === 'string' && coverArt.startsWith('private/')
            ? (project.contract?.releaseId ? `/api/files/release/${project.contract.releaseId}` : null)
            : coverArt
    );

    return (
        <Card className="p-8">
            <h3 className="text-lg font-black mb-8">RELEASE ASSETS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Cover Art */}
                <div>
                    <span className="dash-label">COVER ART</span>
                    <div
                        onClick={() => !uploadingArt && fileInputRef.current?.click()}
                        className={`aspect-square rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden relative transition-colors hover:border-accent/40 ${uploadingArt ? 'cursor-wait' : 'cursor-pointer'}`}
                    >
                        {coverArtSrc ? (
                            coverArtSrc.startsWith('blob:') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={coverArtSrc} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <NextImage src={coverArtSrc} alt="Cover" width={400} height={400} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="text-center flex flex-col items-center gap-2 ds-text-faint">
                                <Upload size={24} />
                                <span className="text-[10px] font-bold tracking-widest">
                                    {uploadingArt ? 'UPLOADING...' : 'UPLOAD 3000×3000px'}
                                </span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                    </div>
                </div>

                {/* Release Date + Submit */}
                <div className="flex flex-col gap-6">
                    <TextField>
                        <Label>Release Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        <span className="text-[9px] ds-text-faint mt-1">Min. 2 weeks from today recommended.</span>
                    </TextField>

                    <Button
                        variant="primary"
                        onPress={handleSave}
                        isDisabled={submitting}
                        className="w-full"
                    >
                        {submitting ? 'SUBMITTING...' : 'SUBMIT FOR DISTRIBUTION'}
                    </Button>

                    {submitting && <p className="text-[10px] ds-text-muted text-center">This may take a moment...</p>}
                </div>
            </div>
        </Card>
    );
}
