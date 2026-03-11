"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BRANDING } from '@/lib/branding';
import { usePublicSettings } from './PublicSettingsContext';
import { DEFAULT_FOOTER_LINKS } from '@/lib/site-content-data';


const Footer = ({ footerLinks = DEFAULT_FOOTER_LINKS }) => {
    const publicSettings = usePublicSettings();
    const socials = {
        discord: publicSettings.discord,
        instagram: publicSettings.instagram,
        spotify: publicSettings.spotify,
        youtube: publicSettings.youtube,
        twitter: publicSettings.twitter,
        facebook: publicSettings.facebook
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
                            {BRANDING.dotName}
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
                            {BRANDING.dotName}
                        </div>

                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginBottom: '30px',
                            fontWeight: '600'
                        }}>
                            Legal
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {footerLinks.legal.map((link) => (
                                <Link key={link.name} href={link.href} className="footer-link">
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Social Column */}
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginBottom: '30px',
                            fontWeight: '600'
                        }}>
                            Follow Us
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {Object.entries(socials).map(([name, url]) => {
                                if (!url) return null;
                                return (
                                    <a
                                        key={name}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="footer-link"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {name.toUpperCase()} <ArrowUpRight size={12} opacity={0.5} />
                                    </a>
                                );
                            })}
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
