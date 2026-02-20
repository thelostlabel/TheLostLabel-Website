"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ReleaseCard from '@/app/components/ReleaseCard';
import BackgroundEffects from '@/app/components/BackgroundEffects';

export default function ArtistDetailClient({ artist, releases }) {
    if (!artist) {
        return (
            <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5vw' }}>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: '900', letterSpacing: '-0.04em' }}>ARTIST_NOT_FOUND</h1>
                <Link href="/artists" style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '30px', fontWeight: '900', letterSpacing: '2px', textDecoration: 'none' }}>
                    ← RETURN_TO_ROSTER
                </Link>
            </div>
        );
    }

    const brutalistCardStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '4px',
        overflow: 'hidden'
    };

    return (
        <div style={{ background: 'transparent', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '120px' }}>
            <BackgroundEffects />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                {/* Artist Header */}
                <header style={{ marginBottom: '100px' }}>
                    <div style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                width: '320px',
                                height: '320px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.02)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                        >
                            <NextImage
                                src={artist.images?.[0]?.url || '/placeholder.png'}
                                alt={artist.name}
                                width={400}
                                height={400}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.1)' }}
                                priority
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{ flex: 1, minWidth: '300px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
                                <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', fontWeight: '900' }}>BRAND_ARTIST</span>
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(42px, 8vw, 100px)',
                                fontWeight: '900',
                                letterSpacing: '-0.04em',
                                lineHeight: '0.9',
                                textTransform: 'uppercase',
                                marginBottom: '25px'
                            }}>
                                {artist.name}
                            </h1>
                            <div style={{ display: 'flex', gap: '40px', fontSize: '13px', color: '#888', flexWrap: 'wrap', fontWeight: '800', letterSpacing: '1px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '9px', color: '#444' }}>FOLLOWERS</span>
                                    <span style={{ color: '#fff' }}>{artist.followers?.total?.toLocaleString('en-US') || 0}</span>
                                </div>
                                {artist.monthlyListeners && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <span style={{ fontSize: '9px', color: '#444' }}>MONTHLY_LISTENERS</span>
                                        <span style={{ color: 'var(--accent)' }}>{artist.monthlyListeners.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                                {artist.genres?.[0] && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <span style={{ fontSize: '9px', color: '#444' }}>CORE_GENRE</span>
                                        <span style={{ color: '#fff', textTransform: 'uppercase' }}>{artist.genres[0]}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                                <a
                                    href={artist.external_urls?.spotify}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '16px 40px',
                                        fontSize: '11px',
                                        textDecoration: 'none',
                                        background: '#fff',
                                        color: '#000',
                                        fontWeight: '900',
                                        letterSpacing: '2px',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(255,255,255,0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    OPEN_SPOTIFY_PROFILE
                                </a>
                                <Link
                                    href="/artists"
                                    style={{
                                        padding: '16px 30px',
                                        fontSize: '11px',
                                        color: '#fff',
                                        fontWeight: '900',
                                        letterSpacing: '2px',
                                        textDecoration: 'none',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    BACK_TO_ROSTER
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </header>

                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '12px', letterSpacing: '5px', fontWeight: '900', color: '#444' }}>
                            PROJECTS <span style={{ color: 'var(--accent)' }}>({releases.length})</span>
                        </h2>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    </div>

                    {releases.length === 0 ? (
                        <div style={{ ...brutalistCardStyle, padding: '100px', textAlign: 'center' }}>
                            <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>DATA_ABSENT: NO RELEASES FOUND IN CATALOG</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' }}>
                            {releases.map((release, i) => (
                                <motion.div
                                    key={release.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.05), duration: 0.4 }}
                                >
                                    <ReleaseCard
                                        id={release.id}
                                        fallbackTitle={release.name}
                                        fallbackArtist={release.artist || artist?.name}
                                        initialData={release}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    );
}
