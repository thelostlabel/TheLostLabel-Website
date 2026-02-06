"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Instagram, Disc, Menu } from 'lucide-react';

export default function Navbar() {
    const { data: session } = useSession();
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

    return (
        <nav className="glass" style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: '1000',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
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
                    <Image
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
                    color: 'var(--text-secondary)'
                }}>
                    <Link href="/releases" style={{ transition: 'var(--transition)' }}>RELEASES</Link>
                    <Link href="/artists" style={{ transition: 'var(--transition)' }}>ARTISTS</Link>
                    {registrationsOpen && <Link href="/join" style={{ transition: 'var(--transition)', color: 'var(--accent)' }}>JOIN US</Link>}
                    <Link href="/#demo" style={{ transition: 'var(--transition)' }}>DEMO</Link>
                </div>

                {/* Right Side Actions */}
                <div className="desktop-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* Socials in Navbar */}
                    <div style={{ display: 'flex', gap: '15px', marginRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                        {socials.discord && (
                            <a href={socials.discord} target="_blank" title="Discord" style={{ color: '#666', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                                <Disc size={18} strokeWidth={2.5} />
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
                                <Link href="/auth/register" className="glow-button" style={{ fontSize: '10px', padding: '10px 20px' }}>
                                    JOIN
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: 0,
                    width: '100%',
                    height: 'calc(100vh - 80px)',
                    background: '#0a0a0b',
                    zIndex: 999,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '30px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Link href="/releases" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>RELEASES</Link>
                    <Link href="/artists" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>ARTISTS</Link>
                    {registrationsOpen && <Link href="/join" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: 'var(--accent)' }}>JOIN US</Link>}
                    <Link href="/#demo" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>SUBMIT DEMO</Link>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>

                    {session ? (
                        <>
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>DASHBOARD</Link>
                            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#888' }}>LOGOUT</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>LOGIN</Link>
                            {registrationsOpen && <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: 'var(--accent)' }}>REGISTER</Link>}
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .mobile-toggle { display: none; }
                @media (max-width: 768px) {
                    .desktop-menu, .desktop-actions { display: none !important; }
                    .mobile-toggle { display: block !important; }
                }
            `}</style>
        </nav>
    );
}
