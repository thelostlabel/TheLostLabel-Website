"use client";
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cinematicAuthStyles } from '../cinematic-auth-styles';

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
            <div className="ca-center" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 36, opacity: 0.4, marginBottom: 16 }}>⚠</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,120,120,0.8)', letterSpacing: 3, marginBottom: 10 }}>INVALID LINK</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
                    The password reset link is missing its token.
                </p>
                <Link href="/auth/forgot-password" className="ca-success-btn">
                    Request New Link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/auth/login'), 3000);
            } else {
                setError(data.error);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ca-center">
            <Link href="/auth/login" className="ca-back">&larr; BACK TO SIGN IN</Link>

            {!success ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="ca-header">
                        <h2>Set New Password</h2>
                        <p>Choose a strong password for your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="ca-form">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="ca-error">
                                {error}
                            </motion.div>
                        )}

                        <div className="ca-field">
                            <label>NEW PASSWORD</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        <div className="ca-field">
                            <label>CONFIRM PASSWORD</label>
                            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>

                        <button type="submit" disabled={loading} className="ca-submit">
                            {loading ? <span className="ca-spinner" /> : 'UPDATE PASSWORD →'}
                        </button>
                    </form>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="ca-success"
                >
                    <div className="ca-success-icon">✓</div>
                    <h3>PASSWORD UPDATED</h3>
                    <p>Your password has been updated successfully. Redirecting to login...</p>
                </motion.div>
            )}
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="ca-root ca-centered">
            <div className="ca-grid" />
            <style jsx global>{cinematicAuthStyles}</style>
            <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 700, letterSpacing: 4 }}>LOADING...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
