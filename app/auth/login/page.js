"use client";
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { HandwrittenLogo } from '@/components/ui/handwritten-logo';
import { cinematicAuthStyles } from '../cinematic-auth-styles';

function LoginContent() {
    const searchParams = useSearchParams();
    const statusParam = searchParams.get('status');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const emailParam = searchParams.get('email') || '';
        if (statusParam === 'pending') {
            router.replace(`/auth/verify-pending?step=approval${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`);
        } else if (statusParam === 'verified') {
            router.replace(`/auth/verify-pending?step=approval${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`);
        }
    }, [statusParam, searchParams, router]);

    if (statusParam === 'pending' || statusParam === 'verified') return null;

    const getSafeCallbackUrl = () => {
        if (typeof window === 'undefined') return '/dashboard';
        const raw = new URLSearchParams(window.location.search).get('callbackUrl');
        if (!raw || !raw.startsWith('/')) return '/dashboard';
        return raw;
    };

    const getFriendlyError = (rawError) => {
        switch (rawError) {
            case 'EMAIL NOT VERIFIED': return 'Your email has not been verified yet.';
            case 'ACCOUNT PENDING APPROVAL': return 'Your email is verified, but your account is pending admin approval.';
            case 'INVALID EMAIL OR PASSWORD': return 'Invalid email or password.';
            case 'TOO MANY ATTEMPTS': return 'Too many attempts. Please try again later.';
            case 'REGISTRATIONS CLOSED': return 'Registrations are currently closed.';
            default: return rawError || 'An error occurred while signing in.';
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await signIn('credentials', { redirect: false, email, password, type: 'login' });
        if (result.error) {
            if (result.error === 'ACCOUNT PENDING APPROVAL') {
                router.push(`/auth/verify-pending?step=approval&email=${encodeURIComponent(email)}`);
                return;
            }
            if (result.error === 'EMAIL NOT VERIFIED') {
                router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
                return;
            }
            setError(result.error);
            setLoading(false);
        } else {
            router.push(getSafeCallbackUrl());
            router.refresh();
        }
    };

    return (
        <div className="ca-root">
            <div className="ca-grid" />
            <style jsx>{cinematicAuthStyles}</style>

            {/* Left branding */}
            <div className="ca-left">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="ca-left-content"
                >
                    <div className="ca-brand-logo">
                        <HandwrittenLogo text="The Lost Company" animate={false} color="#ffffff" font="bofly" />
                    </div>
                    <h1 className="ca-headline">
                        Welcome<br />back.
                    </h1>
                    <p className="ca-tagline">
                        Access your artist portal, manage releases, and check your stats.
                    </p>
                    <div className="ca-divider" />
                    <p className="ca-footnote">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register">Apply now &rarr;</Link>
                    </p>
                </motion.div>
            </div>

            {/* Right form */}
            <motion.div
                className="ca-right"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="ca-header">
                    <Link href="/" className="ca-back">&larr; BACK TO HOME</Link>
                    <h2>Sign In</h2>
                    <p>Access your artist portal</p>
                </div>

                <form onSubmit={handleLogin} className="ca-form">
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="ca-error">
                            <span>{getFriendlyError(error)}</span>
                            {error === 'EMAIL NOT VERIFIED' && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`)}
                                    className="ca-error-action"
                                >
                                    Go to verification center &rarr;
                                </button>
                            )}
                            {error === 'ACCOUNT PENDING APPROVAL' && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/auth/verify-pending?step=approval&email=${encodeURIComponent(email)}`)}
                                    className="ca-error-action"
                                >
                                    Check approval status &rarr;
                                </button>
                            )}
                        </motion.div>
                    )}

                    <div className="ca-field">
                        <label>EMAIL ADDRESS</label>
                        <input type="email" placeholder="artist@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="ca-field">
                        <label>PASSWORD</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <div style={{ textAlign: 'right', marginTop: 2 }}>
                            <Link href="/auth/forgot-password" className="ca-forgot">FORGOT PASSWORD?</Link>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="ca-submit">
                        {loading ? <span className="ca-spinner" /> : 'ENTER PORTAL →'}
                    </button>
                </form>

                <p className="ca-switch">
                    No account?{' '}
                    <Link href="/auth/register">Apply now</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div style={{ background: '#050507', minHeight: '100vh' }} />}>
            <LoginContent />
        </Suspense>
    );
}
