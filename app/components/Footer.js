"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Disc, Youtube, Twitter, Facebook, ArrowUpRight } from 'lucide-react';

const Footer = () => {
    const [socials, setSocials] = useState({});

    useEffect(() => {
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                setSocials({
                    discord: data.discord,
                    instagram: data.instagram,
                    spotify: data.spotify,
                    youtube: data.youtube,
                    twitter: data.twitter,
                    facebook: data.facebook
                });
            })
            .catch(err => console.error(err));
    }, []);

    const footerLinks = {
        explore: [
            { name: 'Home', href: '/' },
            { name: 'Artists', href: '/artists' },
            { name: 'Careers', href: '/careers' },
        ],
        follow: [
            { name: 'Twitter', href: socials.twitter || '#' },
            { name: 'Instagram', href: socials.instagram || '#' },
            { name: 'Facebook', href: socials.facebook || '#' },
        ]
    };

    return (
        <footer style={{
            background: '#050505',
            color: '#fff',
            position: 'relative',
            zIndex: 10,
            overflow: 'hidden'
        }}>
            {/* Main Footer Content */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                minHeight: '400px'
            }}>
                {/* Left Section: Logo & Branding */}
                <div style={{
                    flex: '1 1 400px',
                    padding: '80px 5vw',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Logo */}
                        <div style={{
                            fontSize: 'clamp(40px, 8vw, 80px)',
                            fontWeight: '900',
                            letterSpacing: '-0.05em',
                            marginBottom: '20px',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            LOST.
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '1px', background: '#fff' }}></div>
                            <span style={{
                                fontSize: '14px',
                                color: '#666',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}>
                                Dynamic Record Label
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Section: Navigation */}
                <div style={{
                    flex: '1 1 400px',
                    padding: '80px 5vw',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '80px'
                }}>
                    {/* Explore Column */}
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginBottom: '30px',
                            fontWeight: '600'
                        }}>
                            Explore
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {footerLinks.explore.map((link) => (
                                <Link key={link.name} href={link.href} className="footer-link">
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                        {/* Secondary Logo in right column as shown in ref image */}
                        <div style={{ marginTop: '60px', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.05em', opacity: 0.5 }}>
                            LOST.
                        </div>
                    </div>

                    {/* Follow Column */}
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginBottom: '30px',
                            fontWeight: '600'
                        }}>
                            Follow
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {footerLinks.follow.map((link) => (
                                <a key={link.name} href={link.href} style={{ textDecoration: 'none' }} className="footer-link">
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar Removed */}

            <style jsx global>{`
                .footer-link {
                    font-size: 16px;
                    color: #fff;
                    text-decoration: none;
                    font-weight: 500;
                    letter-spacing: -0.01em;
                    transition: color 0.3s ease, margin-left 0.3s ease;
                }
                .footer-link:hover {
                    color: var(--accent);
                    margin-left: 5px;
                }
                .spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
