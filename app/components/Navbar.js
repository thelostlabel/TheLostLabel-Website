"use client";
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Instagram, Disc, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [registrationsOpen, setRegistrationsOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [siteName, setSiteName] = useState('LOST');
    const [socials, setSocials] = useState({});

    useEffect(() => {
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data.registrationsOpen === false) {
                    setRegistrationsOpen(false);
                }
                if (data.siteName) {
                    setSiteName(data.siteName);
                }
                setSocials({
                    discord: data.discord,
                    instagram: data.instagram,
                    spotify: data.spotify,
                    youtube: data.youtube
                });
            })
            .catch(err => console.error(err));
    }, []);

    // Hide Navbar on Dashboard and Auth pages
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/auth')) {
        return null;
    }

    return (
        <>
            <nav className="glass-premium" style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '95%',
                maxWidth: '1200px',
                borderRadius: '24px',
                zIndex: '1000',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '1200px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Link href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '800',
                        fontSize: '22px',
                        letterSpacing: '2px'
                    }}>
                        <NextImage
                            src="/logo.png"
                            alt={`${siteName} Logo`}
                            width={40}
                            height={40}
                            style={{ mixBlendMode: 'lighten' }}
                        />
                        {siteName}
                    </Link>

                    {/* Desktop Menu */}
                    <div className="desktop-menu" style={{
                        display: 'flex',
                        gap: '40px',
                        fontWeight: '800',
                        fontSize: '11px',
                        letterSpacing: '1.5px',
                        letterSpacing: '1.5px',
                        color: 'rgba(255,255,255,0.85)'
                    }}>
                        <Link href="/releases" style={{ transition: 'var(--transition)' }}>RELEASES</Link>
                        <Link href="/artists" style={{ transition: 'var(--transition)' }}>ARTISTS</Link>
                        <Link href="/faq" style={{ transition: 'var(--transition)' }}>FAQ</Link>
                        <Link href="/join" style={{ transition: 'var(--transition)', color: '#fff' }}>JOIN US</Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="desktop-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {/* Socials in Navbar */}
                        <div style={{ display: 'flex', gap: '15px', marginRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                            <a href={socials.discord} target="_blank" title="Discord" style={{ color: '#666', transition: 'color 0.3s', display: 'flex', alignItems: 'center' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </a>
                            {socials.instagram && (
                                <a href={socials.instagram} target="_blank" title="Instagram" style={{ color: '#666', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                                    <Instagram size={18} strokeWidth={2.5} />
                                </a>
                            )}
                        </div>

                        {session ? (
                            <>
                                <Link href="/dashboard" style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    letterSpacing: '1px',
                                    color: '#fff',
                                    transition: 'var(--transition)'
                                }}>
                                    DASHBOARD
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #333',
                                        color: '#888',
                                        padding: '8px 16px',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        letterSpacing: '1px',
                                        borderRadius: '12px',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    letterSpacing: '1px',
                                    color: 'var(--text-secondary)',
                                    transition: 'var(--transition)'
                                }}>
                                    LOGIN
                                </Link>
                                {registrationsOpen && (
                                    <Link href="/auth/register" className="glow-button animate-pulse-glow" style={{ fontSize: '10px', padding: '10px 24px', borderRadius: '50px' }}>
                                        JOIN NOW
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Drawer - Moved outside nav to avoid stacking context issues */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="mobile-backdrop"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        className="mobile-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mobile-panel-header">
                            <div className="mobile-brand">
                                <NextImage src="/logo.png" alt={`${siteName} Logo`} width={28} height={28} style={{ mixBlendMode: 'lighten' }} />
                                <span>{siteName}</span>
                            </div>
                            <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mobile-panel-title">NAVIGATION</div>

                        <div className="mobile-links">
                            <Link href="/releases" onClick={() => setMobileMenuOpen(false)}>RELEASES</Link>
                            <Link href="/artists" onClick={() => setMobileMenuOpen(false)}>ARTISTS</Link>
                            <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
                            {registrationsOpen && <Link href="/join" onClick={() => setMobileMenuOpen(false)} className="accent-link">JOIN US</Link>}
                        </div>

                        <div className="mobile-divider" />

                        <div className="mobile-links secondary">
                            {session ? (
                                <>
                                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>DASHBOARD</Link>
                                    <button onClick={() => signOut()} className="ghost-link">LOGOUT</button>
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
                                    {registrationsOpen && <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="accent-link">REGISTER</Link>}
                                </>
                            )}
                        </div>

                        <div className="mobile-panel-footer">
                            <div className="socials">
                                {socials.discord && (
                                    <a href={socials.discord} target="_blank" title="Discord">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                        </svg>
                                    </a>
                                )}
                                {socials.instagram && (
                                    <a href={socials.instagram} target="_blank" title="Instagram">
                                        <Instagram size={16} />
                                    </a>
                                )}
                            </div>
                            <div className="tag">LOST.MOBILE</div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .mobile-toggle { display: none !important; }
                @media (max-width: 960px) {
                    .desktop-menu, .desktop-actions { display: none !important; }
                    .mobile-toggle { display: inline-flex !important; }
                }

                .mobile-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(5, 6, 7, 0.75);
                    backdrop-filter: blur(6px);
                    z-index: 998;
                }

                .mobile-panel {
                    position: fixed;
                    top: 90px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: min(560px, 92vw);
                    background: rgba(8, 9, 10, 0.92);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 22px;
                    padding: 22px;
                    z-index: 999;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                    animation: panel-in 180ms ease-out;
                }

                .mobile-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .mobile-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    font-size: 14px;
                }

                .mobile-close {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: #fff;
                    border-radius: 10px;
                    padding: 6px 8px;
                    cursor: pointer;
                }

                .mobile-panel-title {
                    font-size: 9px;
                    letter-spacing: 4px;
                    color: #666;
                    font-weight: 900;
                    margin-bottom: 12px;
                }

                .mobile-links {
                    display: grid;
                    gap: 10px;
                }

                .mobile-links a,
                .mobile-links button {
                    padding: 14px 16px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #fff;
                    font-weight: 800;
                    font-size: 12px;
                    letter-spacing: 1.6px;
                    text-decoration: none;
                    text-align: left;
                }

                .mobile-links.secondary a,
                .mobile-links.secondary button {
                    background: rgba(255,255,255,0.02);
                    color: #cfcfcf;
                }

                .accent-link {
                    color: #000 !important;
                    background: #fff !important;
                    border-color: rgba(0,0,0,0.2) !important;
                }

                .ghost-link {
                    background: transparent !important;
                    border-color: rgba(255,255,255,0.08) !important;
                    color: #888 !important;
                    cursor: pointer;
                }

                .mobile-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.08);
                    margin: 14px 0;
                }

                .mobile-panel-footer {
                    margin-top: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .mobile-panel-footer .socials {
                    display: flex;
                    gap: 10px;
                }

                .mobile-panel-footer a {
                    color: #777;
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 6px;
                    border-radius: 10px;
                    display: inline-flex;
                }

                .mobile-panel-footer .tag {
                    font-size: 9px;
                    letter-spacing: 3px;
                    color: #555;
                    font-weight: 900;
                }

                @keyframes panel-in {
                    from { opacity: 0; transform: translate(-50%, -6px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </>
    );
}
