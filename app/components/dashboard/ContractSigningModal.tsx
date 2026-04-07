"use client";
import { useState, useRef } from 'react';
import { useToast } from '@/app/components/ToastContext';
import { Modal, Card, TextField, TextArea, Input, Label, Button, Checkbox } from '@heroui/react';
import { Upload, X } from 'lucide-react';
import DashboardLoader from './DashboardLoader';

interface ContractSigningModalProps {
    contract: {
        id: string;
        releaseId?: string;
        artistShare?: number | string;
        labelShare?: number | string;
    };
    user: {
        legalName?: string;
        phoneNumber?: string;
        address?: string;
    } | null;
    onClose: () => void;
    onComplete: () => void;
}

export default function ContractSigningModal({ contract, user, onClose, onComplete }: ContractSigningModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useState({
        legalName: user?.legalName || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || ''
    });

    const [agreed, setAgreed] = useState(false);
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileSave = async () => {
        if (!profile.legalName || !profile.phoneNumber || !profile.address) {
            showToast("Please fill in all legal details.", "error");
            return;
        }
        setLoading(true);
        try {
            await fetch('/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(profile)
            });
            setStep(2);
        } catch {
            showToast("Error saving profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        if (!agreed) return;
        setLoading(true);
        try {
            await fetch(`/api/contracts/sign`, {
                method: 'POST',
                body: JSON.stringify({ contractId: contract.id })
            });
            setStep(3);
        } catch {
            showToast("Error signing contract", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!coverArt) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', coverArt);
            formData.append('releaseId', contract.releaseId || '');

            const res = await fetch('/api/upload/cover-art', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'Upload failed');
            }
            onComplete();
        } catch (e) {
            showToast((e as Error).message || "Upload failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const stepIndicator = (
        <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        step >= s ? 'bg-accent text-black' : 'bg-default/10 ds-text-faint'
                    }`}>
                        {s}
                    </div>
                    {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-accent' : 'bg-default/10'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
            <Modal.Backdrop />
            <Modal.Container>
                <Modal.Dialog className="w-full max-w-lg relative">
                    {loading && <DashboardLoader overlay label="PROCESSING" subLabel="Please wait..." />}

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black tracking-widest uppercase ds-text-muted">
                            {step === 1 ? 'LEGAL_DETAILS' : step === 2 ? 'SIGN_CONTRACT' : 'UPLOAD_ARTWORK'}
                        </span>
                        <Button isIconOnly size="sm" variant="ghost" onPress={onClose} aria-label="Close">
                            <X size={14} />
                        </Button>
                    </div>

                    {stepIndicator}

                    {/* STEP 1: LEGAL INFO */}
                    {step === 1 && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-base font-black mb-1">Verify Legal Details</h2>
                                <p className="text-xs ds-text-muted">These details are required for the contract.</p>
                            </div>

                            <TextField>
                                <Label>Full Legal Name</Label>
                                <Input
                                    value={profile.legalName}
                                    onChange={e => setProfile({ ...profile, legalName: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </TextField>

                            <TextField>
                                <Label>Phone Number</Label>
                                <Input
                                    value={profile.phoneNumber}
                                    onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                                    placeholder="+1 555 0123"
                                />
                            </TextField>

                            <TextField>
                                <Label>Full Address</Label>
                                <TextArea
                                    value={profile.address}
                                    onChange={(e: any) => setProfile({ ...profile, address: e.target.value })}
                                    placeholder="123 Music Lane, NY"
                                    rows={3}
                                />
                            </TextField>

                            <Button
                                variant="primary"
                                onPress={handleProfileSave}
                                isDisabled={loading || !profile.legalName || !profile.phoneNumber || !profile.address}
                                className="w-full mt-2"
                            >
                                {loading ? 'SAVING...' : 'CONTINUE TO CONTRACT →'}
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: CONTRACT */}
                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-base font-black">Sign Contract</h2>

                            <Card variant="default" className="p-0">
                                <Card.Content className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="ds-text-muted font-bold tracking-wider">ARTIST SHARE</span>
                                        <span className="text-accent font-black">{(Number(contract?.artistShare || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="ds-text-muted font-bold tracking-wider">LABEL SHARE</span>
                                        <span className="font-black">{(Number(contract?.labelShare || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                    <p className="text-[11px] ds-text-faint leading-relaxed mt-2">
                                        By clicking sign, you agree to the terms of the distribution agreement.
                                        This is a legally binding action.
                                    </p>
                                </Card.Content>
                            </Card>

                            <Checkbox
                                isSelected={agreed}
                                onChange={(checked: boolean) => setAgreed(checked)}
                            >
                                <span className="text-xs">I have read and agree to the terms.</span>
                            </Checkbox>

                            <Button
                                variant="primary"
                                onPress={handleSignContract}
                                isDisabled={!agreed || loading}
                                className="w-full"
                            >
                                {loading ? 'SIGNING...' : 'SIGN CONTRACT (DIGITAL)'}
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: ASSETS */}
                    {step === 3 && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-base font-black mb-1">Upload Cover Art</h2>
                                <p className="text-xs ds-text-muted">Upload high-quality artwork (3000×3000px, JPG/PNG).</p>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-accent/40 hover:bg-accent/5 bg-cover bg-center min-h-[120px] flex items-center justify-center"
                                style={coverArt ? { backgroundImage: `url(${URL.createObjectURL(coverArt)})` } : undefined}
                            >
                                <input type="file" ref={fileInputRef} onChange={e => setCoverArt(e.target.files?.[0] || null)} hidden accept="image/*" />
                                {!coverArt && (
                                    <div className="flex flex-col items-center gap-2 ds-text-faint">
                                        <Upload size={24} />
                                        <span className="text-[10px] font-bold tracking-widest">CLICK TO UPLOAD</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onPress={onComplete} className="flex-1">
                                    SKIP ARTWORK
                                </Button>
                                <Button
                                    variant="primary"
                                    onPress={handleUpload}
                                    isDisabled={!coverArt || loading}
                                    className="flex-[2]"
                                >
                                    {loading ? 'UPLOADING...' : 'FINALIZE & SUBMIT'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Dialog>
            </Modal.Container>
        </Modal>
    );
}
