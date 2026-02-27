"use client";
import React, { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArtistView from '@/app/components/dashboard/ArtistView';
import AdminView from '@/app/components/dashboard/AdminView';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';
import { useMinimumLoader } from '@/lib/use-minimum-loader';

function DashboardContent() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'overview';
    const showAuthLoader = useMinimumLoader(status === 'loading', 900);

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

    React.useEffect(() => {
        if (!session?.user || session.user.image) return;

        const syncArtistAvatar = async () => {
            try {
                const res = await fetch('/api/profile');
                if (!res.ok) return;
                const data = await res.json();
                if (data?.artistImage) {
                    await update({
                        user: {
                            image: data.artistImage,
                            stageName: data.stageName || session.user.stageName,
                            spotifyUrl: data.spotifyUrl || session.user.spotifyUrl,
                            status: data.status || session.user.status
                        }
                    });
                }
            } catch (error) {
                console.error('Artist avatar sync failed', error);
            }
        };

        syncArtistAvatar();
    }, [session, update]);

    if (showAuthLoader) {
        return <DashboardLoader fullScreen label="AUTHENTICATING" subLabel="Checking your dashboard access..." />;
    }

    if (!session) {
        router.push('/auth/login');
        return null;
    }

    const { role, status: accountStatus } = session.user;

    if (accountStatus === 'pending' && role !== 'admin') {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-5">
                <div className="w-full max-w-[500px] rounded-3xl border border-amber-400/25 bg-amber-400/5 p-10 text-center">
                    <h2 className="mb-5 text-2xl font-black tracking-[0.24em] text-amber-400">HESABINIZ ONAY BEKLİYOR</h2>
                    <p className="mb-8 text-sm leading-relaxed text-neutral-400">
                        Kaydınız başarıyla alındı. LOST. ekibi başvurunuzu inceledikten sonra hesabınız aktif edilecektir.<br /><br />
                        Onaylandığında e-posta ile bilgilendirileceksiniz.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 transition hover:border-white/35 hover:text-white"
                    >
                        ANA SAYFAYA DÖN
                    </button>
                </div>
            </div>
        );
    }

    if (accountStatus === 'rejected' && role !== 'admin') {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-5">
                <div className="w-full max-w-[500px] rounded-2xl border border-red-400/25 bg-red-400/5 p-10 text-center">
                    <h2 className="mb-5 text-2xl font-black tracking-[0.24em] text-red-400">BAŞVURUNUZ REDDEDİLDİ</h2>
                    <p className="text-sm leading-relaxed text-neutral-400">
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
        <Suspense fallback={<DashboardLoader fullScreen label="LOADING DASHBOARD" subLabel="Preparing workspace..." />}>
            <DashboardContent />
        </Suspense>
    );
}
