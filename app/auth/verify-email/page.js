"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { cinematicAuthStyles } from '../cinematic-auth-styles';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState(token ? 'verifying' : 'error');
    const [message, setMessage] = useState(
        token ? 'Verifying your email address...' : 'Verification link is invalid or missing.'
    );
    const [verifiedEmail, setVerifiedEmail] = useState('');

    useEffect(() => {
        if (!token) return;
        let isCancelled = false;

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();
                if (res.ok) {
                    if (isCancelled) return;
                    setStatus('success');
                    setVerifiedEmail(data?.email || '');
                    setMessage('Your email has been verified. Your account is now pending admin approval.');
                } else {
                    if (isCancelled) return;
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch {
                if (isCancelled) return;
                setStatus('error');
                setMessage('An error occurred. Please try again.');
            }
        };

        verify();
        return () => { isCancelled = true; };
    }, [token]);

    return (
        <div className="ca-center" style={{ maxWidth: 440 }}>
            <AnimatePresence mode="wait">
                {status === 'verifying' && (
                    <motion.div
                        key="verifying"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}>
                            <Loader size={24} style={{ color: 'rgba(255,255,255,0.4)', animation: 'caSpin 1.2s linear infinite' }} />
                        </div>
                        <h1 style={{
                            fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10,
                            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.45) 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            Verifying
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.7 }}>
                            {message}
                        </p>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="ca-success"
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 4,
                        }}>
                            <CheckCircle size={24} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        </div>
                        <h3>EMAIL VERIFIED</h3>
                        <p>{message}</p>
                        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/auth/login?status=verified" className="ca-success-btn">
                                Sign In
                            </Link>
                            <Link
                                href={`/auth/verify-pending?step=approval${verifiedEmail ? `&email=${encodeURIComponent(verifiedEmail)}` : ''}`}
                                style={{
                                    padding: '12px 24px', borderRadius: 12, textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                                    fontWeight: 700, textDecoration: 'none', fontSize: 11, letterSpacing: 1,
                                }}
                            >
                                Approval Status
                            </Link>
                        </div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: 'rgba(255,60,60,0.06)',
                            border: '1px solid rgba(255,60,60,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}>
                            <AlertCircle size={24} style={{ color: 'rgba(255,120,120,0.7)' }} />
                        </div>
                        <h1 style={{
                            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10,
                            color: 'rgba(255,120,120,0.8)',
                        }}>
                            Verification Failed
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.7, marginBottom: 24 }}>
                            {message}
                        </p>
                        <Link href="/auth/login" className="ca-success-btn">
                            Back to Sign In
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="ca-root ca-centered">
            <div className="ca-grid" />
            <style jsx>{cinematicAuthStyles}</style>
            <Suspense fallback={
                <div style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 700, letterSpacing: 4, fontSize: 9 }}>
                    LOADING...
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
