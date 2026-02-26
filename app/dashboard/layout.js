"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Inbox,
    Mic2,
    FileText,
    Users,
    File,
    Bell,
    Settings,
    Disc,
    Music,
    Upload,
    User,
    LogOut,
    Briefcase,
    DollarSign,
    CreditCard,
    Mail,
    Moon,
    Sun,
    Minimize2,
    Maximize2,
    Menu,
    X,
    Search,
    HelpCircle,
    Book
} from 'lucide-react';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';

function DashboardLayoutContent({ children }) {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'overview';

    const [isRailExpanded, setIsRailExpanded] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
    const [isViewTransitioning, setIsViewTransitioning] = useState(false);

    useEffect(() => {
        localStorage.setItem('dashboard_theme_mode', themeMode);
    }, [themeMode]);

    useEffect(() => {
        localStorage.setItem('dashboard_density_mode', densityMode);
    }, [densityMode]);

    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [currentView]);

    useEffect(() => {
        setIsViewTransitioning(true);
        const timer = setTimeout(() => setIsViewTransitioning(false), 360);
        return () => clearTimeout(timer);
    }, [currentView]);

    if (status === 'loading') {
        return <DashboardLoader fullScreen label="AUTHENTICATING" subLabel="Verifying access permissions..." />;
    }

    if (!session) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', background: '#050505' }}>Access Denied</div>;
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
        { name: 'SETTINGS', view: 'settings', icon: <Settings size={16} />, perm: 'admin_view_settings' }
    ].filter((item) => hasAdminPermission(item.perm));

    const personalItems = [
        { name: 'MY OVERVIEW', view: 'my-overview', icon: <LayoutDashboard size={16} />, perm: 'view_overview' },
        { name: 'MY RELEASES', view: 'my-releases', icon: <Disc size={16} />, perm: 'view_releases' },
        { name: 'MY DEMOS', view: 'my-demos', icon: <Music size={16} />, perm: 'view_demos' },
        { name: 'NEW SUBMISSION', view: 'my-submit', icon: <Upload size={16} />, perm: 'submit_demos' },
        { name: 'EARNINGS', view: 'my-earnings', icon: <DollarSign size={16} />, perm: 'view_earnings' },
        { name: 'CONTRACTS', view: 'my-contracts', icon: <Briefcase size={16} />, perm: 'view_contracts' },
        { name: 'SUPPORT', view: 'my-support', icon: <Inbox size={16} />, perm: 'view_support' },
        { name: 'MY PROFILE', view: 'my-profile', icon: <User size={16} />, perm: 'view_profile' }
    ].filter((item) => hasPermission(item.perm));

    const sections = (isAdmin || isAR)
        ? [
            { label: 'MANAGEMENT', items: mgmtItems },
            { label: 'PERSONAL PORTAL', items: personalItems }
        ]
        : [{ label: 'ARTIST DASHBOARD', items: personalItems }];

    const flatItems = sections.flatMap((section) => section.items);
    const activeItem = flatItems.find((item) => item.view === currentView);

    const isLight = themeMode === 'light';
    const isCompact = densityMode === 'compact';
    const railWidth = isRailExpanded ? (isCompact ? 188 : 206) : (isCompact ? 72 : 82);
    const showRailLabels = isRailExpanded || isMobileNavOpen;

    const shellBackground = isLight ? '#F0F2F5' : '#050505';
    const shellColor = isLight ? '#1F2937' : '#FFFFFF';
    const shellAccent = '#FFFFFF';
    const shellAccent2 = '#A0A0A0';
    const shellSurface = isLight ? '#FFFFFF' : '#0E0E0E';
    const shellSurface2 = isLight ? '#F9FAFB' : '#161616';
    const shellBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.08)';
    const shellMuted = isLight ? '#6B7280' : '#888888';

    return (
        <div
            className={`dashboard-shell dashboard-theme-${themeMode} dashboard-density-${densityMode}`}
            style={{
                minHeight: '100vh',
                background: shellBackground,
                color: shellColor,
                position: 'relative',
                overflowX: 'hidden',
                '--accent': shellAccent,
                '--accent-2': shellAccent2,
                '--surface': shellSurface,
                '--surface-2': shellSurface2,
                '--border': shellBorder,
                '--muted': shellMuted
            }}
        >
            <div
                className="dashboard-ambient"
                aria-hidden
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'transparent'
                }}
            />

            <button
                className="mobile-rail-toggle"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation"
            >
                {isMobileNavOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <aside
                className={`dashboard-rail ${isRailExpanded ? 'expanded' : ''} ${isMobileNavOpen ? 'open' : ''}`}
                style={{ width: `${railWidth}px` }}
            >
                <div className="rail-top">
                    <div className="rail-user-avatar">
                        {session.user.image ? (
                            <img src={session.user.image} alt="Profile" />
                        ) : (
                            <span>{session.user.stageName?.[0] || 'U'}</span>
                        )}
                    </div>
                </div>

                <nav className="rail-nav">
                    {sections.map((section) => (
                        <React.Fragment key={section.label}>
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                return (
                                    <Link
                                        key={item.view}
                                        href={`/dashboard?view=${item.view}`}
                                        className={`rail-item ${isActive ? 'active' : ''}`}
                                        title={item.name}
                                    >
                                        <span className="rail-item-icon">{item.icon}</span>
                                        {showRailLabels && <span className="rail-item-label">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="rail-footer">
                    <button className="rail-footer-btn" title="Help & Support">
                        <HelpCircle size={18} />
                    </button>
                </div>
            </aside>

            {isMobileNavOpen && <div className="dashboard-backdrop" onClick={() => setIsMobileNavOpen(false)} />}

            <main className="dashboard-main" style={{ marginLeft: `${railWidth}px` }}>
                <div className="dashboard-window">
                    <header className="window-toolbar">
                        <div className="window-toolbar-left">
                            <div className="bc-logo">
                                <Image src="/logo.png" alt="LOST" width={32} height={32} className="bc-logo-img" />
                                <span className="bc-logo-text" style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: '950' }}>LOST</span>
                            </div>
                        </div>

                        <div className="window-toolbar-right">
                            <div className="bc-search-container">
                                <Search size={16} className="bc-search-icon" />
                                <input type="text" placeholder="" className="bc-search-input" />
                            </div>

                            <div className="bc-user-avatar">
                                {session.user.image ? (
                                    <img src={session.user.image} alt="" />
                                ) : (
                                    <span>{session.user.stageName?.[0] || 'U'}</span>
                                )}
                            </div>
                        </div>
                    </header>

                    <div style={{ position: 'relative' }}>
                        <AnimatePresence mode="popLayout">
                            <motion.section
                                key={currentView}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="dashboard-content-container"
                            >
                                {children}
                            </motion.section>
                        </AnimatePresence>
                        <AnimatePresence>
                            {isViewTransitioning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <DashboardLoader overlay label="LOADING MODULE" subLabel={`Opening ${activeItem?.name || 'Dashboard'}...`} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .dashboard-shell,
                .dashboard-shell button,
                .dashboard-shell input,
                .dashboard-shell select,
                .dashboard-shell textarea,
                .dashboard-shell th,
                .dashboard-shell td,
                .dashboard-shell a {
                    font-family: 'Space Grotesk', 'Sora', system-ui, -apple-system, sans-serif !important;
                }
                .dashboard-shell h1,
                .dashboard-shell h2,
                .dashboard-shell h3,
                .dashboard-shell h4 {
                    font-family: 'Sora', 'Space Grotesk', system-ui, -apple-system, sans-serif !important;
                    letter-spacing: 0.2px;
                }

                nav.glass {
                    display: none !important;
                }

                .dashboard-rail {
                    position: fixed;
                    left: 16px;
                    top: 16px;
                    bottom: 16px;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    background: #0A0A0A;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(20px);
                    overflow: hidden;
                    transition: width 0.28s ease;
                }

                .rail-top {
                    padding: 24px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .rail-user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid var(--border);
                    background: var(--surface-2);
                    display: grid;
                    place-items: center;
                    font-size: 14px;
                    font-weight: 800;
                    color: var(--text);
                }

                .rail-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .rail-nav {
                    flex: 1;
                    padding: 12px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .rail-item {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    color: var(--muted);
                    background: transparent;
                    transition: all 0.2s ease;
                }

                .rail-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .rail-item.active {
                    background: rgba(255, 255, 255, 0.08);
                    color: var(--accent);
                }

                .rail-item-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rail-footer {
                    padding: 24px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .rail-footer-btn {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    background: transparent;
                    color: var(--muted);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .rail-footer-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .bc-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #fff;
                }

                .bc-logo-icon {
                    color: #fff;
                }

                .bc-logo-text {
                    font-size: 18px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .bc-search-container {
                    position: relative;
                    width: 320px;
                }

                .bc-search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--muted);
                    pointer-events: none;
                }

                .bc-search-input {
                    width: 100%;
                    height: 42px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid var(--border);
                    border-radius: 21px;
                    padding: 0 16px 0 44px;
                    color: #fff;
                    font-size: 13px;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .bc-search-input:focus {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: var(--accent);
                }

                .bc-user-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: var(--surface-2);
                    display: grid;
                    place-items: center;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--text);
                }

                .bc-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }



                .dashboard-main {
                    min-height: 100vh;
                    padding: 16px 16px 16px 24px;
                    transition: margin-left 0.28s ease;
                    position: relative;
                    z-index: 2;
                }

                .dashboard-window {
                    min-height: calc(100vh - 32px);
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    background: #0A0A0A;
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }



                .window-toolbar {
                    min-height: 80px;
                    padding: 0 40px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    background: transparent;
                }

                .window-toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .window-toolbar-right {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 20px;
                    flex: 1;
                }

                .window-user-meta {
                    display: none;
                }

                .window-user-meta span {
                    font-size: 11px;
                    font-weight: 800;
                    color: #fff;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }

                .window-user-meta small {
                    font-size: 10px;
                    color: var(--muted);
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }

                .dashboard-content-container {
                    flex: 1;
                    padding: ${isCompact ? '14px 18px 18px' : '20px 24px 24px'};
                    overflow-y: auto;
                }

                .mobile-rail-toggle {
                    display: none;
                    position: fixed;
                    left: 14px;
                    top: 14px;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid var(--border);
                    background: color-mix(in srgb, var(--surface), #000 6%);
                    color: #fff;
                    z-index: 140;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .dashboard-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 6, 11, 0.58);
                    backdrop-filter: blur(2px);
                    z-index: 98;
                }

                @media (max-width: 1080px) {
                    .window-user-meta {
                        display: none;
                    }
                    .window-user-pill {
                        min-width: auto;
                        width: 40px;
                        justify-content: center;
                        padding: 0;
                    }
                }

                @media (max-width: 880px) {
                    .mobile-rail-toggle {
                        display: inline-flex;
                    }

                    .dashboard-rail {
                        left: 12px;
                        top: 12px;
                        bottom: 12px;
                        transform: translateX(-118%);
                        transition: transform 0.24s ease;
                        width: min(260px, calc(100vw - 24px)) !important;
                        z-index: 130;
                    }

                    .dashboard-rail.open {
                        transform: translateX(0);
                    }

                    .dashboard-main {
                        margin-left: 0 !important;
                        padding: 12px;
                        padding-top: 58px;
                    }

                    .dashboard-window {
                        min-height: calc(100vh - 70px);
                    }

                    .window-toolbar {
                        padding: 0 12px 0 14px;
                        min-height: 64px;
                    }

                    .window-search {
                        height: 34px;
                    }

                    .dashboard-content-container {
                        padding: 14px 12px 16px;
                    }
                }

                @media (max-width: 680px) {
                    .window-toolbar-left {
                        min-width: 0;
                    }

                    .window-caption {
                        font-size: 9px;
                    }

                    .window-title {
                        font-size: 11px;
                    }

                    .window-search {
                        max-width: 180px;
                    }
                }

                .dashboard-content-container table {
                    width: 100%;
                }

                @media (max-width: 768px) {
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

                    .admin-responsive-table {
                        display: table !important;
                        overflow: visible !important;
                    }
                    .admin-responsive-table thead {
                        display: none;
                    }
                    .admin-responsive-table tbody {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 10px;
                    }
                    .admin-responsive-table tr {
                        display: block;
                        border: 1px solid rgba(255,255,255,0.12) !important;
                        border-radius: 10px;
                        padding: 10px 12px;
                        background: rgba(255,255,255,0.03);
                    }
                    .admin-responsive-table td {
                        display: flex !important;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 12px;
                        border-bottom: none !important;
                        white-space: normal !important;
                        padding: 8px 0 !important;
                        font-size: 12px !important;
                    }
                    .admin-responsive-table td::before {
                        content: attr(data-label);
                        color: #8d99ac;
                        font-weight: 800;
                        letter-spacing: 0.6px;
                        font-size: 11px;
                        text-transform: uppercase;
                        min-width: 90px;
                        flex-shrink: 0;
                    }
                    .admin-responsive-table td[data-label="ACTIONS"] {
                        display: block !important;
                    }
                    .admin-responsive-table td[data-label="ACTIONS"]::before {
                        display: block;
                        margin-bottom: 8px;
                    }
                    .admin-responsive-table td[colspan] {
                        display: block !important;
                        text-align: center;
                    }
                    .admin-responsive-table td[colspan]::before {
                        display: none;
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
                    width: 6px;
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(144, 156, 176, 0.3);
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <Suspense
            fallback={
                <div style={{ background: '#050505', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#555' }}>SYNCING_INTERFACE...</p>
                </div>
            }
        >
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}
