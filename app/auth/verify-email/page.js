"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now log in.');
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred. Please try again.');
            }
        };

        verify();
    }, [token, router]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div className="glass" style={{ padding: '40px', maxWidth: '400px', width: '100%', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Email Verification</h1>

                {status === 'verifying' && (
                    <div style={{ color: '#888' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ color: '#4ade80' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                        <p>{message}</p>
                        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ color: '#ef4444' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                        <p>{message}</p>
                        <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '20px', color: '#fff', textDecoration: 'underline' }}>
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
