"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Inbox, Mic2, FileText, Users, File, Bell, Settings,
    Disc, Music, Upload, User, ClipboardList, LogOut, ExternalLink,
    Briefcase, DollarSign, CreditCard
} from 'lucide-react';

function DashboardLayoutContent({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'overview';

    if (status === 'loading') {
        return (
            <div style={{ background: '#0d0d0d', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.p
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}
                >
                    AUTHENTICATING_USER
                </motion.p>
            </div>
        );
    }

    if (!session) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', background: '#0d0d0d' }}>Access Denied</div>;
    }

    const { role } = session.user;
    const isAdmin = role === 'admin';
    const isAR = role === 'a&r';
    const isArtist = role === 'artist';

    const perms = session.user.permissions || {};
    const hasPermission = (perm) => {
        if (!perm) return true;
        if (isAdmin) return true; // Admins bypass artist perms, but we should still check admin-specific ones if needed
        // For artists, permissions default to TRUE unless explicitly FALSE
        return perms[perm] !== false;
    };

    const hasAdminPermission = (perm) => {
        if (role === 'admin') return true; // Super admin bypass
        return perms[perm] === true;
    };

    let menuItems = [];
    if (isAdmin) {
        menuItems = [
            { name: 'OVERVIEW', view: 'overview', icon: <LayoutDashboard size={16} />, perm: 'admin_view_overview' },
            { name: 'SUBMISSIONS', view: 'submissions', icon: <Inbox size={16} />, perm: 'admin_view_submissions' },
            { name: 'ARTISTS', view: 'artists', icon: <Mic2 size={16} />, perm: 'admin_view_artists' },
            { name: 'CONTRACTS', view: 'contracts', icon: <Briefcase size={16} />, perm: 'admin_view_contracts' },
            { name: 'EARNINGS', view: 'earnings', icon: <DollarSign size={16} />, perm: 'admin_view_earnings' },
            { name: 'PAYMENTS', view: 'payments', icon: <CreditCard size={16} />, perm: 'admin_view_payments' },
            { name: 'RELEASES', view: 'releases', icon: <Disc size={16} />, perm: 'admin_view_releases' },
            { name: 'REQUESTS', view: 'requests', icon: <FileText size={16} />, perm: 'admin_view_requests' },
            { name: 'USERS', view: 'users', icon: <Users size={16} />, perm: 'admin_view_users' },
            { name: 'CONTENT', view: 'content', icon: <File size={16} />, perm: 'admin_view_content' },
            { name: 'WEBHOOKS', view: 'webhooks', icon: <Bell size={16} />, perm: 'admin_view_webhooks' },
            { name: 'SETTINGS', view: 'settings', icon: <Settings size={16} />, perm: 'admin_view_settings' },
        ].filter(item => hasAdminPermission(item.perm));
    } else if (isAR) {
        menuItems = [
            { name: 'OVERVIEW', view: 'overview', icon: <LayoutDashboard size={16} />, perm: 'admin_view_overview' },
            { name: 'SUBMISSIONS', view: 'submissions', icon: <Inbox size={16} />, perm: 'admin_view_submissions' },
            { name: 'REQUESTS', view: 'requests', icon: <FileText size={16} />, perm: 'admin_view_requests' },
            { name: 'ARTISTS', view: 'artists', icon: <Mic2 size={16} />, perm: 'admin_view_artists' },
            { name: 'EARNINGS', view: 'earnings', icon: <DollarSign size={16} />, perm: 'admin_view_earnings' },
            { name: 'CONTRACTS', view: 'contracts', icon: <Briefcase size={16} />, perm: 'admin_view_contracts' },
            { name: 'SUPPORT', view: 'support', icon: <Inbox size={16} />, perm: 'view_support' },
            { name: 'MY RELEASES', view: 'releases', icon: <Disc size={16} />, perm: 'view_releases' },
            { name: 'MY DEMOS', view: 'demos', icon: <Music size={16} />, perm: 'view_demos' },
            { name: 'NEW SUBMISSION', view: 'submit', icon: <Upload size={16} />, perm: 'submit_demos' },
        ].filter(item => item.perm.startsWith('admin_') ? hasAdminPermission(item.perm) : hasPermission(item.perm));
    } else {
        menuItems = [
            { name: 'OVERVIEW', view: 'overview', icon: <LayoutDashboard size={16} />, perm: 'view_overview' },
            { name: 'SUPPORT', view: 'support', icon: <Inbox size={16} />, perm: 'view_support' },
            { name: 'MY RELEASES', view: 'releases', icon: <Disc size={16} />, perm: 'view_releases' },
            { name: 'MY DEMOS', view: 'demos', icon: <Music size={16} />, perm: 'view_demos' },
            { name: 'EARNINGS', view: 'earnings', icon: <DollarSign size={16} />, perm: 'view_earnings' },
            { name: 'CONTRACTS', view: 'contracts', icon: <Briefcase size={16} />, perm: 'view_contracts' },
            { name: 'NEW SUBMISSION', view: 'submit', icon: <Upload size={16} />, perm: 'submit_demos' },
            { name: 'MY PROFILE', view: 'profile', icon: <User size={16} />, perm: 'view_profile' },
        ].filter(item => hasPermission(item.perm));
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d0d', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
            {/* Design Layers */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.03, filter: 'url(#noiseFilter)' }} />

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(0,255,136,0.02) 0%, transparent 70%)', filter: 'blur(120px)' }} />
            </div>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: '280px',
                    background: 'rgba(255,255,255,0.01)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100
                }}
            >
                <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link href="/" style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: '#fff', textDecoration: 'none' }}>LOST.</Link>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                    </div>
                    <p style={{ fontSize: '9px', letterSpacing: '2px', color: '#444', marginTop: '8px', fontWeight: '900' }}>
                        {isAdmin ? 'SYSTEM_ADMIN' : isAR ? 'A&R_PORTAL' : 'ARTIST_GATEWAY'}
                    </p>
                </div>

                <nav style={{ flex: 1, padding: '30px 20px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '20px', paddingLeft: '15px' }}>CORE_NAVIGATION</div>
                    {menuItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <Link
                                key={item.view}
                                href={`/dashboard?view=${item.view}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 15px',
                                    marginBottom: '6px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    letterSpacing: '1px',
                                    color: isActive ? '#fff' : '#555',
                                    background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textDecoration: 'none',
                                    border: isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
                                }}
                                className="nav-item"
                            >
                                <span style={{ color: isActive ? 'var(--accent)' : 'inherit', transition: 'color 0.3s' }}>{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '30px 20px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', paddingLeft: '5px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {session.user.stageName?.[0] || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '11px', fontWeight: '900', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{session.user.stageName || (isAdmin ? 'Administrator' : 'User')}</p>
                            <p style={{ fontSize: '9px', color: '#444', letterSpacing: '0.5px' }}>{session.user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '10px',
                            fontWeight: '900',
                            letterSpacing: '2px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            color: '#444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.3s'
                        }}
                        className="logout-btn"
                    >
                        <LogOut size={14} />
                        TERMINATE_SESSION
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: '280px',
                position: 'relative',
                zIndex: 2,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'transparent'
            }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ flex: 1, padding: '40px 5vw' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            <style jsx global>{`
                nav.glass { display: none !important; }
                .nav-item:hover {
                    color: #fff !important;
                    background: rgba(255,255,255,0.05) !important;
                }
                .logout-btn:hover {
                    border-color: rgba(255,68,68,0.2) !important;
                    color: #ff4444 !important;
                    background: rgba(255,68,68,0.02) !important;
                }
                ::-webkit-scrollbar {
                    width: 4px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <Suspense fallback={
            <div style={{ background: '#0d0d0d', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}>SYNCING_INTERFACE...</p>
            </div>
        }>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}
