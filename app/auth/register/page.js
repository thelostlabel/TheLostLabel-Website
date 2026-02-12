"use client";
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundEffects from '../../components/BackgroundEffects';
import { motion } from 'framer-motion';

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
                router.push(`/auth/verify-pending?email=${encodeURIComponent(formData.email)}`);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '10px',
        fontWeight: '900',
        color: 'var(--accent)',
        letterSpacing: '2px',
        textTransform: 'uppercase'
    };

    const inputStyle = {
        width: '100%',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontFamily: 'inherit',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.3s ease'
    };

    if (!registrationsOpen) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050607',
                color: '#fff',
                position: 'relative'
            }}>
                <BackgroundEffects />
                <div className="glass-premium" style={{ textAlign: 'center', padding: '60px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
                    <h2 style={{ fontSize: '24px', letterSpacing: '8px', marginBottom: '20px', fontWeight: '900' }}>INVITE ONLY</h2>
                    <p style={{ color: '#888', fontSize: '11px', letterSpacing: '2px' }}>REGISTRATIONS ARE CURRENTLY CLOSED.</p>
                    <Link href="/" className="glow-button" style={{ display: 'inline-block', marginTop: '40px', padding: '12px 30px', borderRadius: '50px', fontSize: '11px', textDecoration: 'none' }}>RETURN HOME</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', display: 'flex' }}>
            <BackgroundEffects />

            {/* Left Side - Visuals (Hidden on Mobile) */}
            <div style={{
                flex: '1',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} className="desktop-visual">

                <div style={{ position: 'relative', zIndex: 2, padding: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 style={{ fontSize: 'clamp(50px, 5vw, 80px)', fontWeight: '900', lineHeight: '0.9', letterSpacing: '-0.04em', marginBottom: '30px' }}>
                            DEFINE<br />YOUR<br /><span style={{ color: 'var(--accent)' }}>SOUND.</span>
                        </h1>
                        <p style={{ maxWidth: '400px', fontSize: '14px', color: '#888', lineHeight: '1.6', letterSpacing: '0.5px' }}>
                            Join the fastest growing independent distribution network. Keep 100% of your rights.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(5, 6, 7, 0.8)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 8vw', // Responsive padding
                position: 'relative',
                zIndex: 10
            }}>
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div style={{ marginBottom: '60px' }}>
                        <Link href="/" style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#666', marginBottom: '20px', display: 'block', textDecoration: 'none' }}>← BACK TO HOME</Link>
                        <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>CREATE ACCOUNT</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                            JOIN THE COLLECTIVE
                        </p>
                    </div>

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,255,136,0.05)', borderRadius: '24px', border: '1px solid rgba(0,255,136,0.2)' }}>
                            <h2 style={{ fontSize: '24px', letterSpacing: '2px', marginBottom: '20px', color: '#00ff88', fontWeight: '900' }}>APPLICATION RECEIVED</h2>
                            <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.6', marginBottom: '40px' }}>
                                Your account is pending approval.<br />
                                You&apos;ll receive an email once your artist profile is verified.
                            </p>
                            <Link href="/auth/login" className="glow-button" style={{ display: 'inline-block', padding: '15px 40px', borderRadius: '50px', textDecoration: 'none', width: '100%', textAlign: 'center' }}>
                                RETURN TO LOGIN
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {error && (
                                <div style={{ padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', color: '#ff4444', fontSize: '11px', fontWeight: '800' }}>
                                    {error.toUpperCase()}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={labelStyle}>FULL NAME</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        style={inputStyle}
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                        className="input-focus-glow"
                                    />
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={labelStyle}>STAGE NAME</label>
                                    <input
                                        type="text"
                                        placeholder="Phantom"
                                        style={inputStyle}
                                        value={formData.stageName}
                                        onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                                        required
                                        className="input-focus-glow"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    placeholder="artist@example.com"
                                    style={inputStyle}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="input-focus-glow"
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>PASSWORD</label>
                                <input
                                    type="password"
                                    placeholder="Min 8 characters"
                                    style={inputStyle}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="input-focus-glow"
                                />
                            </div>

                            <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '20px', width: '100%', borderRadius: '16px', fontSize: '13px', letterSpacing: '1px' }}>
                                {loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
                            </button>
                        </form>
                    )}

                    <p style={{ marginTop: '40px', fontSize: '11px', color: '#666', fontWeight: '600', textAlign: 'center' }}>
                        Already have an account? <Link href="/auth/login" style={{ color: 'var(--accent)' }}>Login</Link>
                    </p>
                </motion.div>
            </div>

            <style jsx>{`
                .desktop-visual {
                    display: none;
                }
                .input-focus-glow:focus {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 15px rgba(158, 240, 26, 0.1);
                }
                @media (min-width: 1024px) {
                    .desktop-visual {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
