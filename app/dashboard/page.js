"use client";
import React, { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArtistView from '@/app/components/dashboard/ArtistView';
import AdminView from '@/app/components/dashboard/AdminView';

function DashboardContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'overview';

    if (status === 'loading') {
        return <div style={{ padding: '80px', textAlign: 'center', color: '#444', letterSpacing: '2px' }}>AUTHENTICATING...</div>;
    }

    if (!session) {
        router.push('/auth/login');
        return null;
    }

    const { role } = session.user;
    const isArtistView = ['demos', 'submit', 'profile', 'support'].includes(view) || (view === 'releases' && role === 'artist');

    if (role === 'admin') {
        // Admin views everything in AdminView, unless explicitly using artist features?
        // Let's keep Admin purely admin for now, OR allow them to use artist features too if they want.
        // User said: "A&R hem kendi demo paylaşabilicek...". Admin implies superset.
        if (isArtistView) return <ArtistView />;
        return <AdminView />;
    } else if (role === 'a&r') {
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
