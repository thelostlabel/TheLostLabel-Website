"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ExternalLink, Play, Pause } from 'lucide-react';
import { SiteNavbar } from '@/components/ui/site-navbar';
import { PageReveal } from '@/components/ui/page-reveal';
import { toReleaseSlug } from '@/lib/release-slug';
import { usePlayer } from '@/app/components/PlayerContext';

function useDominantColor(src) {
    const [color, setColor] = useState('80,80,100');
    useEffect(() => {
        if (!src) return;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 40; canvas.height = 40;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 40, 40);
                const data = ctx.getImageData(0, 0, 40, 40).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 16) {
                    const pr = data[i], pg = data[i+1], pb = data[i+2];
                    const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
                    if (max - min > 40 && max > 50) { r += pr; g += pg; b += pb; count++; }
                }
                if (count > 0) setColor(`${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)}`);
            } catch {}
        };
        img.src = src;
    }, [src]);
    return color;
}

export default function ArtistDetailClient({ artist, releases }) {
    const { scrollY } = useScroll();
    const heroRef = useRef(null);
    const [scrolledPastHero, setScrolledPastHero] = useState(false);
    const bgY = useTransform(scrollY, [0, 600], [0, 120]);
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    useEffect(() => {
        return scrollY.on('change', v => setScrolledPastHero(v > (heroRef.current?.offsetHeight || 500)));
    }, [scrollY]);

    const img = artist?.images?.[0]?.url || null;
    const accentColor = useDominantColor(img);
    const followersFormatted = artist?.followers?.total
        ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(artist.followers.total)
        : null;
    const listenersFormatted = artist?.monthlyListeners
        ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(artist.monthlyListeners)
        : null;

    const handlePlayRelease = useCallback((release) => {
        if (release.preview_url || release.previewUrl) {
            playTrack({
                id: release.id,
                name: release.name,
                artist: artist?.name || '',
                image: release.image,
                previewUrl: release.preview_url || release.previewUrl,
            });
        }
    }, [playTrack, artist]);

    if (!artist) {
        return (
            <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <p style={{ fontSize: '10px', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>ARTIST NOT FOUND</p>
                <Link href="/artists" style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 700 }}>← ROSTER</Link>
            </div>
        );
    }

    return (
        <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
            <PageReveal />
            <SiteNavbar />

            {/* Grain */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'overlay',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }} />

            {/* Sticky mini header */}
            <AnimatePresence>
                {scrolledPastHero && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
                            background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(24px)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            padding: '10px clamp(24px,5vw,80px)',
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            {img && <NextImage src={img} alt="" fill style={{ objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{artist.name}</p>
                            {listenersFormatted && (
                                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{listenersFormatted} monthly listeners</p>
                            )}
                        </div>
                        {artist.external_urls?.spotify && (
                            <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 999, background: `rgba(${accentColor},0.12)`, border: `1px solid rgba(${accentColor},0.25)`, color: `rgb(${accentColor})`, fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textDecoration: 'none' }}>
                                <ExternalLink size={10} /> SPOTIFY
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HERO ── */}
            <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden' }}>

                {/* Blurred BG */}
                {img && (
                    <motion.div style={{ y: bgY, position: 'absolute', inset: '-20%', zIndex: 0, pointerEvents: 'none' }}>
                        <NextImage src={img} alt="" fill style={{ objectFit: 'cover', filter: 'blur(80px) saturate(2.2) brightness(0.3)' }} priority />
                    </motion.div>
                )}

                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                    background: `linear-gradient(180deg, rgba(${accentColor},0.1) 0%, rgba(5,5,5,0.4) 50%, rgba(5,5,5,0.9) 85%, #050505 100%)` }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 70% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />

                {/* Back */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.5 }}
                    style={{ position: 'absolute', top: 88, left: 'clamp(24px,5vw,80px)', zIndex: 10 }}>
                    <Link href="/artists"
                        style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                    >← ROSTER</Link>
                </motion.div>

                {/* Split layout */}
                <div style={{
                    position: 'relative', zIndex: 2,
                    display: 'flex', alignItems: 'center',
                    padding: 'clamp(100px,14vh,160px) clamp(24px,5vw,80px) clamp(40px,6vh,80px)',
                    gap: 'clamp(40px,5vw,80px)',
                    flexWrap: 'wrap',
                }}>
                    {/* LEFT: Artist photo */}
                    <motion.div
                        initial={{ opacity: 0, x: -40, rotateY: 8 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ duration: 1.3, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flexShrink: 0, width: 'clamp(200px,26vw,340px)' }}
                    >
                        <div style={{
                            borderRadius: '50%', overflow: 'hidden', aspectRatio: '1', position: 'relative',
                            boxShadow: `0 50px 120px rgba(0,0,0,0.8), 0 0 80px rgba(${accentColor},0.18), 0 0 0 1px rgba(255,255,255,0.07)`,
                        }}>
                            {img && <NextImage src={img} alt={artist.name} fill style={{ objectFit: 'cover' }} priority />}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)', pointerEvents: 'none' }} />
                        </div>
                        {/* Reflection */}
                        <div style={{ position: 'relative', height: 50, overflow: 'hidden', marginTop: 1,
                            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)',
                            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)' }}>
                            {img && <NextImage src={img} alt="" fill style={{ objectFit: 'cover', transform: 'scaleY(-1)', filter: 'blur(4px)', borderRadius: '50%' }} />}
                        </div>
                    </motion.div>

                    {/* RIGHT: Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1.2, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flex: 1, minWidth: 'min(100%, 280px)' }}
                    >
                        <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: `rgba(${accentColor},0.7)`, textTransform: 'uppercase' }}>
                            ARTIST · THE LOST LABEL
                        </p>
                        <h1 style={{ margin: '0 0 28px', fontSize: 'clamp(36px,5.5vw,76px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.92, color: '#fff', textTransform: 'uppercase' }}>
                            {artist.name}
                        </h1>

                        {/* Stat chips */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
                            {followersFormatted && (
                                <div style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                                    {followersFormatted} followers
                                </div>
                            )}
                            {listenersFormatted && (
                                <div style={{ padding: '8px 16px', borderRadius: 999, background: `rgba(${accentColor},0.08)`, border: `1px solid rgba(${accentColor},0.2)`, fontSize: '11px', fontWeight: 700, color: `rgba(${accentColor},0.9)` }}>
                                    {listenersFormatted} monthly listeners
                                </div>
                            )}
                            {artist.genres?.[0] && (
                                <div style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {artist.genres[0]}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {artist.external_urls?.spotify && (
                                <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 999, background: '#fff', color: '#000', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(255,255,255,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                                ><ExternalLink size={12} /> SPOTIFY PROFILE</a>
                            )}
                            <Link href="/artists"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 999, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textDecoration: 'none', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
                            >ALL ARTISTS</Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── DISCOGRAPHY ── */}
            {releases.length > 0 && (
                <section style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 clamp(24px,5vw,80px) 120px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '4px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>DISCOGRAPHY</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>{releases.length} {releases.length === 1 ? 'RELEASE' : 'RELEASES'}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                            {releases.map((release, i) => {
                                const rArtist = release.artists?.map(a => a.name).join(', ') || artist?.name || '';
                                const rSlug = toReleaseSlug(release.name, rArtist, release.id);
                                const releaseYear = release.release_date ? new Date(release.release_date).getFullYear() : null;
                                return (
                                    <motion.div
                                        key={release.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.04 }}
                                    >
                                        <Link href={`/releases/${rSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
                                            <div
                                                style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '1', background: '#111', marginBottom: 12, transition: 'transform 0.3s, box-shadow 0.3s' }}
                                                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow=`0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(${accentColor},0.12)`; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                                            >
                                                {release.image && <NextImage src={release.image} alt={release.name} fill style={{ objectFit: 'cover' }} />}
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {release.name}
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                                {releaseYear || (release.type || 'single').toUpperCase()}
                                            </p>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </section>
            )}

            {releases.length === 0 && (
                <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 clamp(24px,5vw,80px) 120px' }}>
                    <div style={{ padding: '80px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16 }}>
                        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontWeight: 700, letterSpacing: '3px' }}>NO RELEASES YET</p>
                    </div>
                </div>
            )}
        </div>
    );
}
