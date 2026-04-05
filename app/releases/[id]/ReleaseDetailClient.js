"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Play, Pause, ExternalLink } from 'lucide-react';
import { usePlayer } from '@/app/components/PlayerContext';
import { toReleaseSlug } from '@/lib/release-slug';
import { SiteNavbar } from '@/components/ui/site-navbar';
import { PageReveal } from '@/components/ui/page-reveal';

function fromSlug(slug) {
    if (!slug) return slug;
    const idx = slug.lastIndexOf('--');
    return idx !== -1 ? slug.slice(idx + 2) : slug;
}
function fmt(ms) {
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(0).padStart(2, '0');
    return `${m}:${s}`;
}

// Extract dominant vibrant color from image via canvas
function useDominantColor(src) {
    const [color, setColor] = useState('100,100,120');
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

function TrackRow({ track, index, active, playing, accentColor, onPlay, image }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => track.preview_url && onPlay(track)}
            style={{
                display: 'grid',
                gridTemplateColumns: '40px 44px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '7px 10px',
                borderRadius: 8,
                cursor: track.preview_url ? 'pointer' : 'default',
                background: active
                    ? `rgba(${accentColor},0.1)`
                    : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                transition: 'background 0.18s',
            }}
        >
            {/* Number / play indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
                {playing ? (
                    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2.5, height: 14 }}>
                        {[0, 0.13, 0.26].map((d, j) => (
                            <motion.span key={j}
                                animate={{ height: ['3px','12px','3px'] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: d }}
                                style={{ width: 2.5, background: `rgb(${accentColor})`, borderRadius: 1.5, display: 'block' }}
                            />
                        ))}
                    </span>
                ) : (hovered && track.preview_url) ? (
                    <Play size={14} fill="rgba(255,255,255,0.85)" color="rgba(255,255,255,0.85)" />
                ) : active ? (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: `rgb(${accentColor})`, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
                ) : (
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
                )}
            </div>

            {/* Thumbnail */}
            <div style={{ width: 44, height: 44, borderRadius: 5, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1a1a1a' }}>
                {image && <NextImage src={image} alt="" fill style={{ objectFit: 'cover' }} />}
            </div>

            {/* Name + artist */}
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em',
                        color: active ? `rgb(${accentColor})` : '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        transition: 'color 0.15s',
                    }}>{track.name}</span>
                    {track.is_version && (
                        <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 3, padding: '2px 5px', flexShrink: 0 }}>VERSION</span>
                    )}
                </div>
                {track.artists?.length > 0 && (
                    <div style={{ marginTop: 2, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.artists.map((a, j) => (
                            <span key={a.id}>
                                <Link href={`/artists/${a.id}`} onClick={e => e.stopPropagation()}
                                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                >{a.name}</Link>
                                {j < track.artists.length - 1 && ', '}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Duration */}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', paddingRight: 4 }}>
                {track.duration_ms > 0 ? fmt(track.duration_ms) : '—'}
            </span>
        </div>
    );
}

export default function ReleaseDetailClient({ initialRelease = null }) {
    const params = useParams();
    const releaseId = fromSlug(params.id);
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [release, setRelease] = useState(initialRelease);
    const [moreReleases, setMoreReleases] = useState([]);
    const [loading, setLoading] = useState(!initialRelease);
    const [error, setError] = useState(false);
    const [scrolledPastHero, setScrolledPastHero] = useState(false);
    const heroRef = useRef(null);
    const { scrollY } = useScroll();
    const bgY = useTransform(scrollY, [0, 700], [0, 150]);

    useEffect(() => {
        return scrollY.on('change', v => setScrolledPastHero(v > (heroRef.current?.offsetHeight || 600)));
    }, [scrollY]);

    useEffect(() => {
        async function load() {
            try {
                // If we have SSR data, use it as base; otherwise fetch from API
                let base = initialRelease;
                if (!base) {
                    const baseRes = await fetch(`/api/releases/${releaseId}`);
                    base = baseRes.ok ? await baseRes.json() : null;
                }
                let final = null;

                const buildFromTrack = (t) => ({
                    id: base?.id || releaseId, name: t.name || base?.name, image: t.image || base?.image,
                    artists: t.artists || base?.artists || [], release_date: t.release_date || base?.release_date,
                    total_tracks: 1, spotify_url: t.spotify_url || base?.spotify_url,
                    streamCountText: base?.streamCountText, versions: base?.versions || [],
                    tracks: [{ id: t.id || releaseId, name: t.name, artists: t.artists || [], duration_ms: t.duration_ms || 0, preview_url: t.preview_url }],
                });

                if (base?.spotify_url) {
                    const aM = base.spotify_url.match(/album\/([a-zA-Z0-9]+)/);
                    const tM = base.spotify_url.match(/track\/([a-zA-Z0-9]+)/);
                    const ep = aM ? `/api/spotify/album/${aM[1]}` : tM ? `/api/spotify/track/${tM[1]}` : null;
                    if (ep) {
                        const r = await fetch(ep);
                        if (r.ok) {
                            const d = await r.json();
                            final = d.tracks ? { ...base, ...d, artists: d.artists || base?.artists } : buildFromTrack(d);
                        }
                    }
                }
                if (!final && base) {
                    final = { ...base, total_tracks: base.total_tracks || 1, tracks: base.tracks || [{ id: base.id, name: base.name, artists: base.artists || [], duration_ms: 0, preview_url: null }] };
                }
                if (!final) throw new Error('not found');

                if (final.versions?.length > 0) {
                    const ids = new Set(final.tracks.map(t => t.id));
                    const names = new Set(final.tracks.map(t => t.name.trim().toLowerCase()));
                    const extra = final.versions
                        .filter(v => !ids.has(v.id) && !names.has(v.name.trim().toLowerCase()))
                        .map(v => ({ id: v.id, name: v.name, artists: v.artists || final.artists, duration_ms: 0, preview_url: v.preview_url, is_version: true }));
                    final.tracks = [...final.tracks, ...extra];
                    final.total_tracks = final.tracks.length;
                }

                setRelease(final);

                // Fetch more from same artist — use base.artists for DB IDs
                const dbArtistId = base?.artists?.[0]?.id;
                if (dbArtistId) {
                    try {
                        const moreRes = await fetch(`/api/releases?artist=${dbArtistId}&limit=6`);
                        if (moreRes.ok) {
                            const moreData = await moreRes.json();
                            setMoreReleases((moreData.releases || []).filter(r => r.id !== final.id).slice(0, 5));
                        }
                    } catch {}
                }
            } catch { setError(true); }
            finally { setLoading(false); }
        }
        if (releaseId) load();
    }, [releaseId, initialRelease]);

    const img = release?.image?.startsWith('private/') ? `/api/files/release/${release.id}` : release?.image;
    const accentColor = useDominantColor(img);
    const artistStr = release?.artists?.map(a => a.name).join(' & ') || '';
    const year = release?.release_date ? new Date(release.release_date).getFullYear() : '';
    const releaseDate = release?.release_date
        ? new Date(release.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;
    const firstPreview = release?.tracks?.find(t => t.preview_url);

    const handlePlay = useCallback((track) => {
        playTrack({ id: track.id, name: track.name, artist: track.artists?.map(a => a.name).join(', '), image: img, previewUrl: track.preview_url });
    }, [playTrack, img]);

    if (error || (!loading && !release)) return (
        <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <p style={{ fontSize: '10px', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>RELEASE NOT FOUND</p>
            <Link href="/releases" style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 700 }}>← CATALOG</Link>
        </div>
    );

    return (
        <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
            <PageReveal />
            <SiteNavbar />

            {/* Grain */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'overlay',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }} />

            {/* Sticky mini header */}
            <AnimatePresence>
                {scrolledPastHero && release && (
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
                        <div style={{ width: 36, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            {img && <NextImage src={img} alt="" fill style={{ objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{release.name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{artistStr}</p>
                        </div>
                        {firstPreview && (
                            <button onClick={() => handlePlay(firstPreview)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 999, background: `rgba(${accentColor},0.15)`, border: `1px solid rgba(${accentColor},0.3)`, color: `rgb(${accentColor})`, fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', cursor: 'pointer' }}>
                                <Play size={11} fill={`rgb(${accentColor})`} /> PLAY
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {release && (
                <>
                    {/* ── HERO ── */}
                    <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden' }}>

                        {/* Saturated blurred BG */}
                        {img && (
                            <motion.div style={{ y: bgY, position: 'absolute', inset: '-20%', zIndex: 0, pointerEvents: 'none' }}>
                                <NextImage src={img} alt="" fill style={{ objectFit: 'cover', filter: 'blur(70px) saturate(2.5) brightness(0.38)' }} priority />
                            </motion.div>
                        )}

                        {/* Color-to-black gradient */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                            background: `linear-gradient(180deg, rgba(${accentColor},0.12) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0.85) 85%, #050505 100%)` }} />
                        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                            background: 'radial-gradient(ellipse at 70% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />

                        {/* Back */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}
                            style={{ position: 'absolute', top: 88, left: 'clamp(24px,5vw,80px)', zIndex: 10 }}>
                            <Link href="/releases" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                            >← CATALOG</Link>
                        </motion.div>

                        {/* Split layout */}
                        <div style={{
                            position: 'relative', zIndex: 2,
                            display: 'flex', alignItems: 'center',
                            padding: 'clamp(100px,14vh,160px) clamp(24px,5vw,80px) clamp(40px,6vh,80px)',
                            gap: 'clamp(40px,5vw,80px)',
                            flexWrap: 'wrap',
                        }}>
                            {/* LEFT: Cover */}
                            <motion.div
                                initial={{ opacity: 0, x: -40, rotateY: 8 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                transition={{ duration: 1.3, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                                style={{ flexShrink: 0, width: 'clamp(200px,28vw,360px)' }}
                            >
                                {/* Cover */}
                                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1',
                                    boxShadow: `0 50px 120px rgba(0,0,0,0.8), 0 0 80px rgba(${accentColor},0.2), 0 0 0 1px rgba(255,255,255,0.07)` }}>
                                    {img && <NextImage src={img} alt={release.name} fill style={{ objectFit: 'cover' }} priority />}
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
                                </div>
                                {/* Reflection */}
                                <div style={{ position: 'relative', height: 60, overflow: 'hidden', marginTop: 1,
                                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)' }}>
                                    {img && <NextImage src={img} alt="" fill style={{ objectFit: 'cover', transform: 'scaleY(-1)', filter: 'blur(3px)' }} />}
                                </div>
                            </motion.div>

                            {/* RIGHT: Info */}
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1.2, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                                style={{ flex: 1, minWidth: 'min(100%, 300px)' }}
                            >
                                <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: `rgba(${accentColor},0.7)`, textTransform: 'uppercase' }}>
                                    {release.type || 'SINGLE'}{year ? ` · ${year}` : ''}
                                </p>
                                <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(32px,5.5vw,72px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.92, color: '#fff' }}>
                                    {release.name}
                                </h1>
                                <p style={{ margin: '0 0 32px', fontSize: 'clamp(14px,1.6vw,20px)', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
                                    {release.artists?.map((a, i) => (
                                        <span key={a.id}>
                                            <Link href={`/artists/${a.id}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                                            >{a.name}</Link>
                                            {i < release.artists.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}> & </span>}
                                        </span>
                                    ))}
                                </p>

                                {/* Stat chips */}
                                <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
                                    {releaseDate && (
                                        <div style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                                            {releaseDate}
                                        </div>
                                    )}
                                    {release.streamCountText && (
                                        <div style={{ padding: '8px 16px', borderRadius: 999, background: `rgba(${accentColor},0.08)`, border: `1px solid rgba(${accentColor},0.2)`, fontSize: '11px', fontWeight: 700, color: `rgba(${accentColor},0.9)` }}>
                                            {release.streamCountText}
                                        </div>
                                    )}
                                    {release.total_tracks > 1 && (
                                        <div style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                                            {release.total_tracks} tracks
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {firstPreview && (
                                        <button onClick={() => handlePlay(firstPreview)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 999, background: '#fff', color: '#000', border: 'none', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(255,255,255,0.2)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                                        ><Play size={12} fill="#000" /> PLAY PREVIEW</button>
                                    )}
                                    {release.spotify_url && (
                                        <a href={release.spotify_url} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 999, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.14)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textDecoration: 'none', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}
                                        ><ExternalLink size={12} /> OPEN IN SPOTIFY</a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* ── TRACKLIST ── */}
                    <section style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', padding: '0 clamp(24px,5vw,80px) 80px' }}>
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '4px', color: 'rgba(255,255,255,0.2)' }}>TRACKLIST</span>
                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>
                                    {release.total_tracks} {release.total_tracks === 1 ? 'SONG' : 'SONGS'}
                                </span>
                            </div>

                            {release.tracks?.map((track, i) => (
                                <motion.div key={track.id}
                                    initial={{ opacity: 0, x: -16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                    <TrackRow
                                        track={track} index={i} total={release.tracks.length}
                                        active={currentTrack?.id === track.id}
                                        playing={currentTrack?.id === track.id && isPlaying}
                                        accentColor={accentColor}
                                        onPlay={handlePlay} image={img}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>

                    {/* ── MORE FROM ARTIST ── */}
                    {moreReleases.length > 0 && (
                        <section style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', padding: '0 clamp(24px,5vw,80px) 120px' }}>
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '4px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                                        MORE FROM {release.artists?.[0]?.name?.toUpperCase()}
                                    </span>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 14 }}>
                                    {moreReleases.map((r, i) => {
                                        const rArtist = r.artists?.map(a => a.name).join(', ') || r.artist || '';
                                        const rSlug = toReleaseSlug(r.name, rArtist, r.id);
                                        return (
                                            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}>
                                                <Link href={`/releases/${rSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
                                                    <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '1', background: '#111', marginBottom: 10,
                                                        transition: 'transform 0.3s, box-shadow 0.3s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.6)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                                                    >
                                                        {r.image && <NextImage src={r.image} alt={r.name} fill style={{ objectFit: 'cover', transition: 'transform 0.4s' }} />}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</p>
                                                    <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rArtist}</p>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
