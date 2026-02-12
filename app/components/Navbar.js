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
                        {registrationsOpen && <Link href="/join" style={{ transition: 'var(--transition)', color: 'var(--accent)' }}>JOIN US</Link>}
                        <Link href="/#demo" style={{ transition: 'var(--transition)' }}>DEMO</Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="desktop-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {/* Socials in Navbar */}
                        <div style={{ display: 'flex', gap: '15px', marginRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                            {socials.discord && (
                                <a href={socials.discord} target="_blank" title="Discord" style={{ color: '#666', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-discord">
                                        <path d="M14.9 6.2s-.9-1.2-1.7-1.6c.1.3.2.7.4 1 0-.1-2.4-1.1-4.7-1.1-2.3 0-4.6 1-4.7 1.1.2-.3.3-.7.4-1-.8.4-1.7 1.6-1.7 1.6C.4 11.2 0 16 0 16.1c1.9 2.3 4.9 2.3 4.9 2.3l1-1.2c-1-.3-1.9-.9-2.7-1.5.3.2.7.4 1 .6 2 .9 4.1.9 6.1 0 .4-.2.8-.3 1-.6-.8.7-1.7 1.3-2.7 1.5l1 1.2s3 0 4.9-2.3c0-.1-.4-4.9-2.5-9.9zM7.5 13.3c-1 0-1.8-1-1.8-2.2s.8-2.2 1.8-2.2c1 0 1.8 1 1.8 2.2s-.8 2.2-1.8 2.2zm7.1 0c-1 0-1.8-1-1.8-2.2s.8-2.2 1.8-2.2c1 0 1.8 1 1.8 2.2s-.8 2.2-1.8 2.2z" />
                                    </svg>
                                </a>
                            )}
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
                                <NextImage src="/logo.png" alt={`${siteName} Logo`} width={28} height={28} />
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
                            <Link href="/#demo" onClick={() => setMobileMenuOpen(false)}>SUBMIT DEMO</Link>
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
                                        <Disc size={16} />
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
                    background: var(--accent) !important;
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
