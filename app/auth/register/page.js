"use client";
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        stageName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [registrationsOpen, setRegistrationsOpen] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.config) {
                    const parsed = JSON.parse(data.config);
                    if (parsed.registrationsOpen === false) {
                        setRegistrationsOpen(false);
                    }
                }
            })
            .catch(err => console.error(err));
    }, []);

    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!registrationsOpen) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                color: '#fff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '24px', letterSpacing: '8px', marginBottom: '20px' }}>INVITE ONLY</h2>
                    <p style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>REGISTRATIONS ARE CURRENTLY CLOSED.</p>
                    <Link href="/" style={{ display: 'block', marginTop: '40px', fontSize: '10px', color: '#444', textDecoration: 'underline' }}>RETURN HOME</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex' }}>
            {/* Left Side - Visuals (Hidden on Mobile) */}
            <div style={{
                flex: '1',
                position: 'relative',
                overflow: 'hidden'
            }} className="desktop-visual">
                {/* Background Image / Abstract */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 30% 50%, #2a2a2a, #000)',
                    zIndex: 0
                }} />

                {/* Noise */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.05,
                    filter: 'url(#noiseFilter)',
                    zIndex: 1
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '80px',
                    zIndex: 2
                }}>
                    <h1 style={{ fontSize: '60px', fontWeight: '900', lineHeight: '0.9', letterSpacing: '-0.03em', marginBottom: '20px' }}>
                        DEFINE<br />YOUR<br /><span style={{ color: 'var(--accent)' }}>SOUND.</span>
                    </h1>
                    <p style={{ maxWidth: '400px', fontSize: '13px', color: '#888', lineHeight: '1.6', letterSpacing: '0.5px' }}>
                        Join the fastest growing independent distribution network. Keep 100% of your rights.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: '#0a0a0a',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 8vw', // Responsive padding
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>KAYIT OL</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>
                        LOST. HESABI OLUŞTURUN
                    </p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                        <h2 style={{ fontSize: '24px', letterSpacing: '2px', marginBottom: '20px', color: '#00ff88' }}>BAŞVURU ALINDI</h2>
                        <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.6', marginBottom: '40px' }}>
                            Hesabınız oluşturuldu ve onay bekliyor.<br />
                            Erişiminiz onaylandığında e-posta ile bilgilendirileceksiniz.
                        </p>
                        <Link href="/auth/login" className="glow-button" style={{ display: 'inline-block', padding: '15px 30px', textDecoration: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                            GİRİŞ EKRANINA DÖN
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {error && <p style={{ color: '#ff4444', fontSize: '12px', fontWeight: '800' }}>{error.toUpperCase()}</p>}

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>AD SOYAD</label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    style={inputStyle}
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>SANATÇI İSMİ (Stage Name)</label>
                                <input
                                    type="text"
                                    placeholder="Phantom"
                                    style={inputStyle}
                                    value={formData.stageName}
                                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>E-POSTA</label>
                            <input
                                type="email"
                                placeholder="mail@example.com"
                                style={inputStyle}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>ŞİFRE</label>
                            <input
                                type="password"
                                placeholder="min 8 characters"
                                style={inputStyle}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '18px', width: '100%' }}>
                            {loading ? 'OLUŞTURULUYOR...' : 'HESAP OLUŞTUR'}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: '40px', fontSize: '11px', color: '#666', fontWeight: '600' }}>
                    ZATEN ÜYE MİSİNİZ? <Link href="/auth/login" style={{ color: '#fff', textDecoration: 'underline' }}>GİRİŞ YAP</Link>
                </p>
            </div>

            <style jsx>{`
                .desktop-visual {
                    display: none;
                }
                @media (min-width: 1024px) {
                    .desktop-visual {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '2px'
};

const inputStyle = {
    width: '100%',
    padding: '14px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '0',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none'
};
