"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState(token ? 'verifying' : 'error'); // verifying, success, error
    const [message, setMessage] = useState(
        token ? 'Email adresiniz dogrulaniyor...' : 'Dogrulama baglantisi gecersiz veya eksik.'
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
                    setMessage('E-posta adresiniz dogrulandi. Hesabiniz su an admin onayi bekliyor.');
                } else {
                    if (isCancelled) return;
                    setStatus('error');
                    setMessage(data.error || 'Dogrulama islemi basarisiz oldu.');
                }
            } catch {
                if (isCancelled) return;
                setStatus('error');
                setMessage('Bir hata olustu. Lutfen tekrar deneyin.');
            }
        };

        verify();
        return () => {
            isCancelled = true;
        };
    }, [token]);

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
                <h1 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>E-Posta Dogrulama</h1>
                <p style={{ color: '#888', fontSize: '14px', marginBottom: '22px' }}>
                    Hesabinizin guvenligi icin e-posta baglantisini kontrol ediyoruz.
                </p>

                {status === 'verifying' && (
                    <div style={{ color: '#888' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ color: '#4ade80' }}>
                        <div style={{ fontSize: '40px', marginBottom: '14px' }}>OK</div>
                        <p>{message}</p>
                        <div style={{ marginTop: '22px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/auth/login" style={{ padding: '10px 16px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: '700', textDecoration: 'none' }}>
                                Giris Ekrani
                            </Link>
                            <Link
                                href={`/auth/verify-pending?step=approval${verifiedEmail ? `&email=${encodeURIComponent(verifiedEmail)}` : ''}`}
                                style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: '700', textDecoration: 'none' }}
                            >
                                Onay Durumu
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ color: '#ef4444' }}>
                        <div style={{ fontSize: '40px', marginBottom: '14px' }}>X</div>
                        <p>{message}</p>
                        <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '20px', color: '#fff', textDecoration: 'underline' }}>
                            Giris Sayfasina Don
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
