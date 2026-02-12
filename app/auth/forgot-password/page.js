
"use client";
import Link from 'next/link';
import { useState } from 'react';
import BackgroundEffects from '../../components/BackgroundEffects';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
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

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', display: 'flex' }}>
            <BackgroundEffects />

            <div style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                background: 'rgba(5, 6, 7, 0.8)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 8vw',
                position: 'relative',
                zIndex: 10
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ marginBottom: '60px' }}>
                        <Link href="/auth/login" style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#666', marginBottom: '20px', display: 'block', textDecoration: 'none' }}>← BACK TO LOGIN</Link>
                        <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>FORGOT<br />PASSWORD</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                            RECOVER YOUR ACCOUNT
                        </p>
                    </div>

                    {!message ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {error && (
                                <div style={{ padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', color: '#ff4444', fontSize: '11px', fontWeight: '800' }}>
                                    {error.toUpperCase()}
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    placeholder="artist@example.com"
                                    style={inputStyle}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input-focus-glow"
                                />
                            </div>

                            <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '20px', width: '100%', borderRadius: '16px', fontSize: '13px', letterSpacing: '1px' }}>
                                {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
                            </button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '40px', marginBottom: '20px' }}>📧</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>CHECK YOUR INBOX</h3>
                            <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>{message}</p>
                            <Link href="/auth/login" className="glow-button" style={{ display: 'inline-block', marginTop: '30px', padding: '12px 30px', borderRadius: '12px', textDecoration: 'none', fontSize: '11px' }}>
                                RETURN TO LOGIN
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <style jsx>{`
                .input-focus-glow:focus {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 15px rgba(158, 240, 26, 0.1);
                }
            `}</style>
        </div>
    );
}
