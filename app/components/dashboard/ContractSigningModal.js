"use client";
import { useState, useRef } from 'react';

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
    transition: 'border-color 0.2s',
    marginBottom: '10px'
};

export default function ContractSigningModal({ contract, user, onClose, onComplete }) {
    const [step, setStep] = useState(1); // 1: Profile, 2: Contract, 3: Assets
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        legalName: user?.legalName || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || ''
    });

    // Contract State
    const [agreed, setAgreed] = useState(false);

    // Assets State
    const [coverArt, setCoverArt] = useState(null);
    const fileInputRef = useRef(null);

    const handleProfileSave = async () => {
        if (!profile.legalName || !profile.phoneNumber || !profile.address) {
            alert("Please fill in all legal details.");
            return;
        }
        setLoading(true);
        try {
            await fetch('/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(profile)
            });
            setStep(2);
        } catch (e) {
            alert("Error saving profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        if (!agreed) return;
        setLoading(true);
        try {
            // Sign contract API logic would go here
            await fetch(`/api/contracts/sign`, {
                method: 'POST',
                body: JSON.stringify({ contractId: contract.id })
            });
            setStep(3);
        } catch (e) {
            alert("Error signing contract");
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
            formData.append('releaseId', contract.releaseId);

            await fetch('/api/upload/cover-art', {
                method: 'POST',
                body: formData
            });
            onComplete();
        } catch (e) {
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="glass" style={{ width: '500px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header Steps */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                    <div style={{ opacity: step === 1 ? 1 : 0.4, fontWeight: '800', fontSize: '10px', letterSpacing: '1px' }}>1. LEGAL INFO</div>
                    <div style={{ opacity: step === 2 ? 1 : 0.4, fontWeight: '800', fontSize: '10px', letterSpacing: '1px' }}>2. CONTRACT</div>
                    <div style={{ opacity: step === 3 ? 1 : 0.4, fontWeight: '800', fontSize: '10px', letterSpacing: '1px' }}>3. ARTWORK</div>
                </div>

                {/* STEP 1: LEGAL INFO */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Verify Legal Details</h2>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>These details are required for the contract.</p>

                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', marginBottom: '5px', color: '#888' }}>FULL LEGAL NAME</label>
                        <input value={profile.legalName} onChange={e => setProfile({ ...profile, legalName: e.target.value })} style={inputStyle} placeholder="John Doe" />

                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', marginBottom: '5px', color: '#888' }}>PHONE NUMBER</label>
                        <input value={profile.phoneNumber} onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })} style={inputStyle} placeholder="+1 555 0123" />

                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', marginBottom: '5px', color: '#888' }}>FULL ADDRESS</label>
                        <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="123 Music Lane, NY" />

                        <button onClick={handleProfileSave} disabled={loading} className="glow-button" style={{ width: '100%', marginTop: '10px', padding: '15px', fontWeight: '800' }}>
                            {loading ? 'SAVING...' : 'CONTINUE TO CONTRACT →'}
                        </button>
                    </div>
                )}

                {/* STEP 2: CONTRACT */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Sign Contract</h2>
                        <div style={{ background: '#0a0a0b', padding: '20px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', color: '#ccc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>ARTIST SHARE:</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{(contract.artistShare * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>LABEL SHARE:</span>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{(contract.labelShare * 100).toFixed(0)}%</span>
                            </div>
                            <p style={{ marginTop: '15px', lineHeight: '1.5', color: '#666' }}>
                                By clicking sign, you agree to the terms of the Lost Music Group distribution agreement.
                                This is a legally binding action.
                            </p>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '20px' }}>
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                            I have read and agree to the terms.
                        </label>

                        <button onClick={handleSignContract} disabled={!agreed || loading} className="glow-button" style={{ width: '100%', padding: '15px', fontWeight: '800', opacity: agreed ? 1 : 0.5 }}>
                            {loading ? 'SIGNING...' : 'SIGN CONTRACT (DIGITAL)'}
                        </button>
                    </div>
                )}

                {/* STEP 3: ASSETS */}
                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Upload Cover Art</h2>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                            Upload high-quality artwork (3000x3000px, JPG/PNG).
                        </p>

                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                border: '2px dashed #333', borderRadius: '12px', padding: '40px',
                                textAlign: 'center', cursor: 'pointer', marginBottom: '20px',
                                background: coverArt ? `url(${URL.createObjectURL(coverArt)}) center/cover` : 'transparent'
                            }}
                        >
                            <input type="file" ref={fileInputRef} onChange={e => setCoverArt(e.target.files[0])} hidden accept="image/*" />
                            {!coverArt && <span style={{ fontSize: '12px', color: '#666' }}>CLICK TO UPLOAD</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={onComplete} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#666', borderRadius: '8px', cursor: 'pointer' }}>SKIP ARTWORK</button>
                            <button onClick={handleUpload} disabled={!coverArt || loading} className="glow-button" style={{ flex: 2, padding: '15px', fontWeight: '800' }}>
                                {loading ? 'UPLOADING...' : 'FINALIZE & SUBMIT'}
                            </button>
                        </div>
                    </div>
                )}

                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>✕</button>
            </div>
        </div>
    );
}
