"use client";
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Inbox, Mic2, FileText, Users, File, Bell, Settings,
    Disc, Music, Upload, User, ClipboardList, LogOut, ExternalLink,
    Briefcase, DollarSign, CreditCard, X
} from 'lucide-react';

function DashboardLayoutContent({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'overview';
    const [isCollapsed, setIsCollapsed] = useState(false);
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

    const perms = session.user.permissions || {};
    const hasPermission = (perm) => {
        if (!perm) return true;
        if (isAdmin) return true;
        return perms[perm] !== false;
    };

    const hasAdminPermission = (perm) => {
        if (role === 'admin') return true;
        return perms[perm] === true;
    };

    const mgmtItems = [
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

    const personalItems = [
        { name: 'MY OVERVIEW', view: 'my-overview', icon: <LayoutDashboard size={16} />, perm: 'view_overview' },
        { name: 'MY RELEASES', view: 'my-releases', icon: <Disc size={16} />, perm: 'view_releases' },
        { name: 'MY DEMOS', view: 'my-demos', icon: <Music size={16} />, perm: 'view_demos' },
        { name: 'NEW SUBMISSION', view: 'my-submit', icon: <Upload size={16} />, perm: 'submit_demos' },
        { name: 'EARNINGS', view: 'my-earnings', icon: <DollarSign size={16} />, perm: 'view_earnings' },
        { name: 'CONTRACTS', view: 'my-contracts', icon: <Briefcase size={16} />, perm: 'view_contracts' },
        { name: 'SUPPORT', view: 'my-support', icon: <Inbox size={16} />, perm: 'view_support' },
        { name: 'MY PROFILE', view: 'my-profile', icon: <User size={16} />, perm: 'view_profile' },
    ].filter(item => hasPermission(item.perm));

    let sections = [];
    if (isAdmin || isAR) {
        sections = [
            { label: 'MANAGEMENT', items: mgmtItems },
            { label: 'PERSONAL PORTAL', items: personalItems }
        ];
    } else {
        sections = [
            { label: 'ARTIST DASHBOARD', items: personalItems }
        ];
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

            {/* Global Sidebar Toggle */}
            <button
                className="dashboard-menu-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 10000,
                    background: '#0a0a0b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {isCollapsed ? <LayoutDashboard size={20} /> : <X size={20} />}
            </button>

            {/* Sidebar */}
            <motion.aside
                className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}
                style={{
                    width: isCollapsed ? '80px' : '280px',
                    background: 'rgba(255, 255, 255, 0.03)', // Subtle white tint for frosted glass
                    backdropFilter: 'blur(40px) saturate(150%)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    top: 0,
                    left: 0,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    padding: isCollapsed ? '40px 0' : '40px 30px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '130px'
                }}>
                    <Link href="/" style={{
                        fontSize: isCollapsed ? '12px' : '24px',
                        fontWeight: '900',
                        letterSpacing: isCollapsed ? '1px' : '4px',
                        color: '#fff',
                        textDecoration: 'none',
                        transition: 'all 0.3s'
                    }}>
                        {isCollapsed ? 'LOST' : 'LOST.'}
                    </Link>
                    {!isCollapsed && (
                        <p style={{ fontSize: '9px', letterSpacing: '2px', color: '#444', marginTop: '8px', fontWeight: '900' }}>
                            {isAdmin ? 'SYSTEM_ADMIN' : isAR ? 'A&R_PORTAL' : 'ARTIST_GATEWAY'}
                        </p>
                    )}
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, padding: isCollapsed ? '30px 10px' : '30px 20px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {sections.map((section, sIdx) => (
                        <div key={section.label} style={{ marginBottom: '30px' }}>
                            {!isCollapsed && (
                                <div style={{ fontSize: '9px', color: '#222', fontWeight: '900', letterSpacing: '3px', marginBottom: '20px', paddingLeft: '15px' }}>
                                    {section.label}
                                </div>
                            )}
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                return (
                                    <Link
                                        key={item.view}
                                        href={`/dashboard?view=${item.view}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                                            gap: isCollapsed ? '0' : '12px',
                                            padding: '12px 15px',
                                            marginBottom: '6px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            letterSpacing: '1px',
                                            color: isActive ? '#fff' : '#555',
                                            background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            transition: 'all 0.3s',
                                            textDecoration: 'none',
                                            border: isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <span style={{ color: isActive ? 'var(--accent)' : 'inherit', minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: isCollapsed ? '20px 10px' : '30px 20px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', paddingLeft: '5px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {session.user.stageName?.[0] || 'U'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: '11px', fontWeight: '900', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{session.user.stageName || (isAdmin ? 'Administrator' : 'User')}</p>
                                <p style={{ fontSize: '9px', color: '#444', letterSpacing: '0.5px' }}>{session.user.email}</p>
                            </div>
                        </div>
                    )}

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
                        <LogOut size={isCollapsed ? 18 : 14} />
                        {!isCollapsed && 'TERMINATE_SESSION'}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="dashboard-main" style={{
                flex: 1,
                marginLeft: isCollapsed ? '80px' : '280px',
                position: 'relative',
                zIndex: 2,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'transparent',
                width: '100%',
                transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ flex: 1, padding: '40px 5vw' }}
                        className="dashboard-content-container"
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
                
                .dashboard-menu-toggle { display: none !important; }
                
                @media (max-width: 768px) {
                    .dashboard-sidebar {
                        width: ${isCollapsed ? '70px' : '280px'} !important;
                        background: rgba(255, 255, 255, 0.03) !important;
                        backdrop-filter: blur(40px) saturate(150%);
                    }
                    .dashboard-main {
                        margin-left: ${isCollapsed ? '70px' : '0'} !important;
                        padding-top: 70px;
                    }
                    .dashboard-content-container {
                        padding: 20px 5vw !important;
                    }
                    .dashboard-menu-toggle {
                        display: flex !important;
                        top: 15px !important;
                        left: 15px !important;
                    }
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
