"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Inbox, Mic2, FileText, Users, File, Bell, Settings,
    Disc, Music, Upload, User, ClipboardList, LogOut, ExternalLink,
    Briefcase, DollarSign, CreditCard, Mail, Moon, Sun, Minimize2, Maximize2,
    ChevronLeft, ChevronRight
} from 'lucide-react';

function DashboardLayoutContent({ children }) {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'overview';
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768;
    });
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        const storedTheme = localStorage.getItem('dashboard_theme_mode');
        return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    });
    const [densityMode, setDensityMode] = useState(() => {
        if (typeof window === 'undefined') return 'comfortable';
        const storedDensity = localStorage.getItem('dashboard_density_mode');
        return storedDensity === 'compact' || storedDensity === 'comfortable' ? storedDensity : 'comfortable';
    });

    useEffect(() => {
        localStorage.setItem('dashboard_theme_mode', themeMode);
    }, [themeMode]);

    useEffect(() => {
        localStorage.setItem('dashboard_density_mode', densityMode);
    }, [densityMode]);
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
        { name: 'COMMUNICATIONS', view: 'communications', icon: <Mail size={16} />, perm: 'admin_view_communications' },
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

    const isLight = themeMode === 'light';
    const isCompact = densityMode === 'compact';

    const sidebarExpandedWidth = isCompact ? 212 : 228;
    const sidebarCollapsedWidth = isCompact ? 64 : 72;
    const contentScale = isCompact ? 0.92 : 1;

    const shellBackground = isLight
        ? 'linear-gradient(180deg, #eef4fc 0%, #e8f0fb 52%, #dde9f7 100%)'
        : 'linear-gradient(180deg, #111214 0%, #0f1012 52%, #0c0d0f 100%)';
    const shellColor = isLight ? '#223041' : '#eceef1';
    const shellAccent = isLight ? '#2d63b3' : '#b9bec8';
    const shellAccent2 = isLight ? '#2f8f85' : '#969da8';
    const shellSurface = isLight ? 'rgba(255,255,255,0.78)' : 'rgba(26,27,31,0.78)';
    const shellSurfaceHover = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(36,38,43,0.9)';
    const shellBorder = isLight ? 'rgba(54,91,140,0.18)' : 'rgba(212,216,224,0.15)';

    return (
        <div className={`dashboard-shell dashboard-theme-${themeMode} dashboard-density-${densityMode}`} style={{
            display: 'flex',
            minHeight: '100vh',
            background: shellBackground,
            color: shellColor,
            position: 'relative',
            overflowX: 'hidden',
            '--accent': shellAccent,
            '--accent-2': shellAccent2,
            '--surface': shellSurface,
            '--surface-hover': shellSurfaceHover,
            '--border': shellBorder
        }}>
            {/* Ambient Background Mesh */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: 0, background: isLight ? 'radial-gradient(circle at 20% 10%, rgba(120,162,226,0.24) 0%, transparent 42%), radial-gradient(circle at 80% 0%, rgba(132,198,208,0.18) 0%, transparent 45%), radial-gradient(circle at 50% 60%, rgba(255,255,255,0.5) 0%, transparent 70%)' : 'radial-gradient(circle at 20% 10%, rgba(108,112,122,0.12) 0%, transparent 46%), radial-gradient(circle at 80% 0%, rgba(92,96,105,0.08) 0%, transparent 48%), radial-gradient(circle at 50% 60%, rgba(170,174,182,0.03) 0%, transparent 65%)', opacity: 1 }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
                    mixBlendMode: 'overlay',
                    opacity: isLight ? 0.36 : 0.2
                }} />
            </div>

            {/* Global Sidebar Toggle */}
            <button
                className="dashboard-menu-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    position: 'fixed',
                    top: '22px',
                    left: isCollapsed ? '12px' : `${sidebarExpandedWidth - 10}px`,
                    zIndex: 10000,
                    background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(20, 21, 24, 0.94)',
                    border: `1px solid ${isLight ? 'rgba(54,91,140,0.24)' : 'rgba(188,213,255,0.24)'}`,
                    color: isLight ? '#24467c' : '#e8f0ff',
                    padding: isCompact ? '7px 9px' : '8px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    minWidth: isCollapsed ? '38px' : '78px'
                }}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                <span style={{ fontSize: '10px', letterSpacing: '0.6px', fontWeight: '900' }}>
                    {isCollapsed ? '' : 'MENU'}
                </span>
            </button>

            {/* Sidebar */}
            <motion.aside
                className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}
                style={{
                    width: isCollapsed ? `${sidebarCollapsedWidth}px` : `${sidebarExpandedWidth}px`,
                    background: isLight ? 'rgba(242,248,255,0.92)' : 'rgba(18, 19, 22, 0.92)',
                    backdropFilter: 'blur(28px) saturate(165%)',
                    borderRight: `1px solid ${isLight ? 'rgba(54,91,140,0.2)' : 'rgba(197,217,245,0.16)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    top: 0,
                    left: 0,
                    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    padding: isCollapsed ? (isCompact ? '22px 0' : '30px 0') : (isCompact ? '24px 16px' : '32px 22px'),
                    borderBottom: `1px solid ${isLight ? 'rgba(54,91,140,0.16)' : 'rgba(197,217,245,0.14)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: isCompact ? '84px' : '96px'
                }}>
                    <Link href="/" style={{
                        fontSize: isCollapsed ? (isCompact ? '10px' : '11px') : (isCompact ? '19px' : '21px'),
                        fontWeight: '900',
                        letterSpacing: isCollapsed ? '1.3px' : (isCompact ? '3.2px' : '4px'),
                        color: isLight ? '#1f3963' : '#fff',
                        textDecoration: 'none',
                        transition: 'all 0.3s',
                        filter: isLight ? 'drop-shadow(0 0 14px rgba(45,99,179,0.24))' : 'drop-shadow(0 0 18px rgba(139,183,255,0.28))'
                    }}>
                        {isCollapsed ? 'LOST' : 'LOST.'}
                    </Link>
                    {!isCollapsed && (
                        <p style={{ fontSize: '8px', letterSpacing: isCompact ? '2px' : '2.6px', color: isLight ? '#48628a' : '#9aa7bc', marginTop: '8px', fontWeight: '800', opacity: 0.92 }}>
                            {isAdmin ? 'SYSTEM_ADMIN' : isAR ? 'A&R_PORTAL' : 'ARTIST_GATEWAY'}
                        </p>
                    )}
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, padding: isCollapsed ? (isCompact ? '14px 6px' : '18px 8px') : (isCompact ? '16px 10px' : '20px 12px'), overflowY: 'auto', overflowX: 'hidden' }}>
                    {sections.map((section, sIdx) => (
                        <div key={section.label} style={{ marginBottom: isCompact ? '16px' : '22px' }}>
                            {!isCollapsed && (
                                <div style={{ fontSize: '8px', color: isLight ? '#5c7296' : '#a7b4c8', fontWeight: '800', letterSpacing: isCompact ? '1.6px' : '2px', marginBottom: isCompact ? '8px' : '12px', paddingLeft: '10px', opacity: 0.95 }}>
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
                                            gap: isCollapsed ? '0' : '10px',
                                            padding: isCompact ? '8px 10px' : '11px 13px',
                                            marginBottom: isCompact ? '4px' : '7px',
                                            borderRadius: '11px',
                                            fontSize: isCompact ? '9px' : '10px',
                                            fontWeight: '800',
                                            letterSpacing: '1px',
                                            color: isActive ? (isLight ? '#19345e' : '#f4f5f7') : (isLight ? 'rgba(29,55,92,0.78)' : 'rgba(226,229,234,0.72)'),
                                            background: isActive ? (isLight ? 'rgba(74,126,214,0.18)' : 'rgba(171,177,188,0.14)') : 'transparent',
                                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            textDecoration: 'none',
                                            border: isActive ? (isLight ? '1px solid rgba(57,103,180,0.28)' : '1px solid rgba(209,214,223,0.22)') : '1px solid transparent',
                                            whiteSpace: 'nowrap',
                                            boxShadow: isActive ? '0 8px 18px rgba(34,56,89,0.35)' : 'none'
                                        }}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <span style={{ color: isActive ? 'var(--accent)' : 'inherit', minWidth: '18px', display: 'flex', justifyContent: 'center', filter: isActive ? 'drop-shadow(0 0 8px var(--accent))' : 'none', opacity: isActive ? 1 : 0.55 }}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: isCollapsed ? (isCompact ? '12px 6px' : '14px 8px') : (isCompact ? '12px 12px' : '16px 14px'), background: isLight ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.015)', borderTop: `1px solid ${isLight ? 'rgba(54,91,140,0.14)' : 'rgba(197,217,245,0.16)'}` }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: isCollapsed ? 'column' : 'row',
                        gap: '8px',
                        marginBottom: isCompact ? '10px' : '12px'
                    }}>
                        <button
                            onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                            title="Toggle light mode"
                            style={{
                                flex: 1,
                                background: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(26, 27, 31, 0.92)',
                                border: `1px solid ${isLight ? 'rgba(54,91,140,0.24)' : 'rgba(188,213,255,0.24)'}`,
                                color: isLight ? '#24467c' : '#e8f0ff',
                                padding: isCompact ? '7px 9px' : '8px 10px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: '700'
                            }}
                        >
                            {isLight ? <Moon size={13} /> : <Sun size={13} />}
                            {!isCollapsed && (isLight ? 'Dark' : 'Light')}
                        </button>
                        <button
                            onClick={() => setDensityMode((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'))}
                            title="Toggle compact mode"
                            style={{
                                flex: 1,
                                background: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(26, 27, 31, 0.92)',
                                border: `1px solid ${isLight ? 'rgba(54,91,140,0.24)' : 'rgba(188,213,255,0.24)'}`,
                                color: isLight ? '#24467c' : '#e8f0ff',
                                padding: isCompact ? '7px 9px' : '8px 10px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '10px',
                                fontWeight: '700'
                            }}
                        >
                            {isCompact ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                            {!isCollapsed && (isCompact ? 'Comfort' : 'Compact')}
                        </button>
                    </div>

                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isCompact ? '10px' : '14px', paddingLeft: '4px' }}>
                            <div style={{ width: isCompact ? '28px' : '31px', height: isCompact ? '28px' : '31px', borderRadius: '10px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', border: '1px solid var(--border)', color: isLight ? '#1f3e6b' : '#fff' }}>
                                {session.user.stageName?.[0] || 'U'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: isCompact ? '10px' : '11px', fontWeight: '800', color: isLight ? '#24436f' : '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '0.2px' }}>{session.user.stageName || (isAdmin ? 'Administrator' : 'User')}</p>
                                <p style={{ fontSize: '8px', color: isLight ? '#607ca7' : '#b3bfd1', letterSpacing: '0.2px' }}>{session.user.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => window.location.href = '/dashboard/settings'}
                        style={{
                            width: '100%',
                            padding: isCompact ? '10px' : '13px',
                            fontSize: isCompact ? '9px' : '10px',
                            fontWeight: '900',
                            letterSpacing: '1.6px',
                            background: 'transparent',
                            border: `1px solid ${isLight ? 'rgba(54,91,140,0.18)' : 'rgba(197,217,245,0.16)'}`,
                            borderRadius: '11px',
                            color: isLight ? '#44648e' : '#b7c4da',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.4s',
                            marginBottom: isCompact ? '8px' : '10px'
                        }}
                        className="settings-btn"
                    >
                        <Settings size={isCollapsed ? 20 : 16} />
                        {!isCollapsed && 'SETTINGS'}
                    </button>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                            width: '100%',
                            padding: isCompact ? '10px' : '13px',
                            fontSize: isCompact ? '9px' : '10px',
                            fontWeight: '900',
                            letterSpacing: '1.8px',
                            background: 'transparent',
                            border: `1px solid ${isLight ? 'rgba(54,91,140,0.18)' : 'rgba(197,217,245,0.16)'}`,
                            borderRadius: '11px',
                            color: isLight ? '#44648e' : '#b7c4da',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.4s'
                        }}
                        className="logout-btn"
                    >
                        <LogOut size={isCollapsed ? 20 : 16} />
                        {!isCollapsed && 'TERMINATE'}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="dashboard-main" style={{
                flex: 1,
                marginLeft: isCollapsed ? `${sidebarCollapsedWidth}px` : `${sidebarExpandedWidth}px`,
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
                        style={{
                            flex: 1,
                            padding: isCompact ? '16px 1.8vw' : '24px 2.4vw',
                            width: `${100 / contentScale}%`,
                            transform: `scale(${contentScale})`,
                            transformOrigin: 'top left'
                        }}
                        className="dashboard-content-container"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            <style jsx global>{`
                nav.glass { display: none !important; }
                .nav-item:hover {
                    color: inherit !important;
                    background: rgba(255,255,255,0.05) !important;
                }
                .logout-btn:hover {
                    border-color: rgba(255,68,68,0.35) !important;
                    color: #ff4444 !important;
                    background: rgba(255,68,68,0.06) !important;
                }
                .settings-btn:hover {
                    border-color: rgba(139,183,255,0.32) !important;
                    color: var(--accent) !important;
                    background: rgba(139,183,255,0.06) !important;
                }
                
                .dashboard-menu-toggle {
                    display: flex !important;
                }
                
                @media (max-width: 768px) {
                    .dashboard-sidebar {
                        width: ${isCollapsed ? '0' : (isCompact ? '228px' : '248px')} !important;
                        background: ${isLight ? 'rgba(242,248,255,0.96)' : 'rgba(22, 30, 41, 0.95)'} !important;
                        backdrop-filter: blur(24px) saturate(150%);
                        transform: ${isCollapsed ? 'translateX(-100%)' : 'translateX(0)'};
                        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .dashboard-main {
                        margin-left: 0 !important;
                        padding-top: 70px;
                        width: 100vw;
                    }
                    .dashboard-content-container {
                        padding: ${isCompact ? '14px 12px' : '20px 16px'} !important;
                        width: 100% !important;
                        transform: none !important;
                    }
                    .dashboard-content-container {
                        max-width: 100%;
                    }
                    .dashboard-menu-toggle {
                        display: flex !important;
                        top: 15px !important;
                        left: 15px !important;
                    }

                    .dashboard-content-container table {
                        display: block;
                        width: 100%;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .dashboard-content-container thead,
                    .dashboard-content-container tbody,
                    .dashboard-content-container tr,
                    .dashboard-content-container th,
                    .dashboard-content-container td {
                        white-space: nowrap;
                    }
                    .dashboard-content-container .glass {
                        border-radius: 16px;
                    }
                    .earnings-metrics {
                        grid-template-columns: 1fr !important;
                    }
                    .earnings-form {
                        grid-template-columns: 1fr !important;
                    }
                    .earnings-form > div {
                        grid-column: auto !important;
                    }
                }

                ::-webkit-scrollbar {
                    width: 4px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                        background: ${isLight ? 'rgba(67,108,166,0.28)' : 'rgba(187,191,198,0.24)'};
                    border-radius: 10px;
                }

                .dashboard-theme-light .dashboard-content-container {
                    filter: invert(1) hue-rotate(180deg);
                }
                .dashboard-theme-light .dashboard-content-container img,
                .dashboard-theme-light .dashboard-content-container video,
                .dashboard-theme-light .dashboard-content-container canvas,
                .dashboard-theme-light .dashboard-content-container iframe {
                    filter: invert(1) hue-rotate(180deg);
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
