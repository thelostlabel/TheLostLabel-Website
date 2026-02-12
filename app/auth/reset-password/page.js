
"use client";
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BackgroundEffects from '../../components/BackgroundEffects';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ff4444' }}>INVALID LINK</h2>
                <p style={{ color: '#888', marginTop: '10px' }}>The password reset link is missing its token.</p>
                <Link href="/auth/forgot-password" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '800', fontSize: '11px' }}>REQUEST NEW LINK</Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '10px', letterSpacing: '-0.02em', fontWeight: '900' }}>SET NEW<br />PASSWORD</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                    SECURE YOUR ACCOUNT
                </p>
            </div>

            {!success ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {error && (
                        <div style={{ padding: '15px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', color: '#ff4444', fontSize: '11px', fontWeight: '800' }}>
                            {error.toUpperCase()}
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>NEW PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={inputStyle}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-focus-glow"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>CONFIRM PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={inputStyle}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="input-focus-glow"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: '20px', padding: '20px', width: '100%', borderRadius: '16px', fontSize: '13px', letterSpacing: '1px' }}>
                        {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                    </button>
                </form>
            ) : (
                <div style={{ padding: '30px', background: 'rgba(0,255,100,0.05)', border: '1px solid rgba(0,255,100,0.2)', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '20px' }}>✅</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px', color: '#00ff66' }}>SUCCESS!</h3>
                    <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.6' }}>Your password has been updated. Redirecting to login...</p>
                </div>
            )}
        </motion.div>
    );
}

export default function ResetPassword() {
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
                <Suspense fallback={<div style={{ color: '#666', fontSize: '10px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}>LOADING_SECURE_AUTH...</div>}>
                    <ResetPasswordContent />
                </Suspense>
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
