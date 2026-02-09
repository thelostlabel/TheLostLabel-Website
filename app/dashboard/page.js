"use client";
import React, { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArtistView from '@/app/components/dashboard/ArtistView';
import AdminView from '@/app/components/dashboard/AdminView';

function DashboardContent() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'overview';

    // Real-time status sync for pending/rejected users
    React.useEffect(() => {
        if (session?.user && (session.user.status === 'pending' || session.user.status === 'rejected')) {
            const checkStatus = async () => {
                try {
                    const res = await fetch('/api/profile');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status !== session.user.status) {
                            // Status changed! Update session or reload
                            await update({ status: data.status });
                            window.location.reload();
                        }
                    }
                } catch (e) {
                    console.error("Status check failed", e);
                }
            };

            const interval = setInterval(checkStatus, 5000); // Check every 5s
            return () => clearInterval(interval);
        }
    }, [session, update]);

    if (status === 'loading') {
        return <div style={{ padding: '80px', textAlign: 'center', color: '#444', letterSpacing: '2px' }}>AUTHENTICATING...</div>;
    }

    if (!session) {
        router.push('/auth/login');
        return null;
    }

    const { role, status: accountStatus } = session.user;

    if (accountStatus === 'pending' && role !== 'admin') {
        return (
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '500px',
                    textAlign: 'center',
                    background: 'rgba(255,170,0,0.05)',
                    border: '1px solid rgba(255,170,0,0.2)',
                    padding: '40px',
                    borderRadius: '24px'
                }}>
                    <h2 style={{ fontSize: '24px', letterSpacing: '4px', color: '#ffaa00', marginBottom: '20px' }}>HESABINIZ ONAY BEKLİYOR</h2>
                    <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                        Kaydınız başarıyla alındı. LOST. ekibi başvurunuzu inceledikten sonra hesabınız aktif edilecektir.<br /><br />
                        Onaylandığında e-posta ile bilgilendirileceksiniz.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '10px 20px', fontSize: '11px', cursor: 'pointer', borderRadius: '12px' }}
                    >
                        ANA SAYFAYA DÖN
                    </button>
                </div>
            </div>
        );
    }

    if (accountStatus === 'rejected' && role !== 'admin') {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ maxWidth: '500px', textAlign: 'center', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', padding: '40px', borderRadius: '16px' }}>
                    <h2 style={{ fontSize: '24px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px' }}>BAŞVURUNUZ REDDEDİLDİ</h2>
                    <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
                        Üzgünüz, sanatçı başvurunuz şu aşamada kabul edilemedi. Daha fazla bilgi için destek ekibiyle iletişime geçebilirsiniz.
                    </p>
                </div>
            </div>
        );
    }

    const isArtistView = view.startsWith('my-');

    if (role === 'admin' || role === 'a&r') {
        if (isArtistView) return <ArtistView />;
        return <AdminView />;
    } else {
        return <ArtistView />;
    }
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: '#444' }}>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
