"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { toReleaseSlug } from '@/lib/release-slug';
import { SiteNavbar } from '@/components/ui/site-navbar';
import { PageReveal } from '@/components/ui/page-reveal';

function useMouseTilt(ref) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const handleMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
        setTilt({ x, y });
    };
    const reset = () => setTilt({ x: 0, y: 0 });
    return { tilt, handleMove, reset };
}

function ReleaseItem({ release, index, featured, isMobile }) {
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef(null);
    const { tilt, handleMove, reset } = useMouseTilt(cardRef);
    const artistName = release.artists?.map(a => a.name).join(', ') || release.artist || release.artistName || '';
    const slug = toReleaseSlug(release.name, artistName, release.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: isMobile ? 20 : 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: isMobile ? 0.3 : 0.6, delay: isMobile ? 0 : Math.min((index % 6) * 0.07, 0.35), ease: [0.16, 1, 0.3, 1] }}
            style={{ gridColumn: featured ? 'span 2' : 'span 1', perspective: isMobile ? 'none' : '800px' }}
        >
            <Link href={`/releases/${slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div
                    ref={cardRef}
                    onMouseEnter={isMobile ? undefined : () => setHovered(true)}
                    onMouseLeave={isMobile ? undefined : () => { setHovered(false); reset(); }}
                    onMouseMove={isMobile ? undefined : handleMove}
                    style={{
                        position: 'relative',
                        borderRadius: featured ? '20px' : '14px',
                        overflow: 'hidden',
                        background: '#0a0a0a',
                        border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)'}`,
                        transition: 'border-color 0.3s, box-shadow 0.4s',
                        boxShadow: hovered ? '0 30px 80px rgba(0,0,0,0.7)' : '0 4px 24px rgba(0,0,0,0.4)',
                        cursor: 'pointer',
                        transform: (!isMobile && hovered) ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-6px)` : 'none',
                        transformStyle: isMobile ? 'flat' : 'preserve-3d',
                        transitionProperty: 'transform, border-color, box-shadow',
                        transitionDuration: hovered ? '0.1s, 0.3s, 0.4s' : '0.6s, 0.3s, 0.4s',
                        transitionTimingFunction: 'ease-out',
                    }}
                >
                    {/* Cover art — 3/4 ratio */}
                    <div style={{ position: 'relative', width: '100%', paddingBottom: featured ? '60%' : '133%', background: '#111' }}>
                        {release.image ? (
                            <NextImage
                                src={release.image}
                                alt={release.name}
                                fill
                                sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
                                style={{
                                    objectFit: 'cover',
                                    transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)',
                                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                                }}
                            />
                        ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '40px', opacity: 0.15 }}>♪</span>
                            </div>
                        )}

                        {/* Gradient overlay — always subtle, strong on hover */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
                            opacity: hovered ? 1 : 0.5,
                            transition: 'opacity 0.35s',
                        }} />

                        {/* LISTEN button — slides in on hover */}
                        <motion.div
                            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                position: 'absolute', bottom: 16, left: 16,
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.9)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '11px', marginLeft: '2px', color: '#000' }}>▶</span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#fff' }}>LISTEN</span>
                        </motion.div>

                        {/* Popularity badge */}
                        {release.popularity > 65 && (
                            <div style={{
                                position: 'absolute', top: 12, right: 12,
                                background: 'rgba(0,0,0,0.75)',
                                backdropFilter: isMobile ? 'none' : 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '999px',
                                padding: '3px 10px',
                                fontSize: '9px', fontWeight: '900', letterSpacing: '1.5px',
                                color: 'rgba(255,255,255,0.8)',
                            }}>
                                HOT
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: featured ? '18px 20px 20px' : '12px 14px 14px' }}>
                        <p style={{
                            margin: 0,
                            fontSize: featured ? '15px' : '12px',
                            fontWeight: '700',
                            color: '#fff',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {release.name}
                        </p>
                        <p style={{
                            margin: '4px 0 0',
                            fontSize: '10px', fontWeight: '500',
                            color: 'rgba(255,255,255,0.35)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {artistName}
                            {release.release_date && (
                                <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 8 }}>
                                    {new Date(release.release_date).getFullYear()}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function ReleasesClient() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sortBy, setSortBy] = useState('popularity');
    const [pagination, setPagination] = useState({ page: 1, hasNextPage: false, total: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const heroRef = useRef(null);
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 280], [1, 0]);
    const heroY = useTransform(scrollY, [0, 280], [0, -80]);
    const heroScale = useTransform(scrollY, [0, 280], [1, 0.94]);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const fetchReleases = useCallback(async (page = 1, append = false) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(false);
        try {
            const res = await fetch(`/api/releases?page=${page}&limit=24`);
            const data = await res.json();
            if (data.releases) {
                setReleases(prev => append
                    ? [...prev, ...data.releases.filter(r => !prev.some(p => p.id === r.id))]
                    : data.releases
                );
                if (data.pagination) setPagination(data.pagination);
            } else setError(true);
        } catch { setError(true); }
        finally {
            if (append) setLoadingMore(false);
            else setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReleases(); }, [fetchReleases]);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 280);
        return () => clearTimeout(t);
    }, [searchQuery]);
    const filtered = useMemo(() => {
        let result = [...releases];
        if (debouncedQuery) {
            const q = debouncedQuery.toLowerCase();
            result = result.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.artist?.toLowerCase().includes(q) ||
                r.artists?.some(a => a.name?.toLowerCase().includes(q))
            );
        }
        if (sortBy === 'popularity') result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        else if (sortBy === 'date') result.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        else if (sortBy === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return result;
    }, [releases, debouncedQuery, sortBy]);

    return (
        <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
            <PageReveal />
            <SiteNavbar />

            {/* Banner background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: "url('/lostbanner.png')",
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: isMobile ? 0 : 0.055,
                filter: isMobile ? 'none' : 'grayscale(30%)',
            }} />

            {/* Grain — desktop only */}
            {!isMobile && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.03,
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
                    mixBlendMode: 'overlay',
                }} />
            )}

            {/* Hero header — parallax (desktop only) */}
            <motion.div
                ref={heroRef}
                style={isMobile ? { position: 'relative', zIndex: 2 } : { opacity: heroOpacity, y: heroY, scale: heroScale, position: 'relative', zIndex: 2, transformOrigin: 'top center' }}
            >
                <div style={{ padding: 'clamp(130px, 20vh, 220px) clamp(24px, 5vw, 80px) 60px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: isMobile ? 20 : 70, filter: isMobile ? 'none' : 'blur(24px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: isMobile ? 0.5 : 1.3, delay: isMobile ? 0.1 : 0.75, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            <Link href="/"
                                style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}
                                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}
                            >← HOME</Link>
                            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
                                {loading ? '···' : `${pagination.total || filtered.length} RELEASES`}
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(64px, 13vw, 160px)',
                            fontWeight: '900',
                            letterSpacing: '-0.055em',
                            lineHeight: 0.85,
                            margin: 0,
                            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.15) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            CATALOG
                        </h1>
                        <p style={{
                            marginTop: '20px', fontSize: '11px', fontWeight: '600',
                            letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)',
                            textTransform: 'uppercase',
                        }}>
                            The Lost Label — Full Discography
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Sticky controls */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    background: isMobile ? 'rgba(5,5,5,0.97)' : 'rgba(5,5,5,0.88)',
                    backdropFilter: isMobile ? 'none' : 'blur(28px)',
                    WebkitBackdropFilter: isMobile ? 'none' : 'blur(28px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '12px clamp(24px, 5vw, 80px)',
                    display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
                }}
            >
                <input
                    type="text"
                    placeholder="Search releases or artists..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1, minWidth: '200px',
                        padding: '9px 15px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '9px',
                        color: '#fff', fontSize: '12px', fontWeight: '500',
                        outline: 'none', letterSpacing: '0.02em',
                    }}
                />
                <div style={{ display: 'flex', gap: '5px' }}>
                    {[['popularity', 'Popular'], ['date', 'Newest'], ['name', 'A–Z']].map(([val, label]) => (
                        <button key={val} onClick={() => setSortBy(val)} style={{
                            padding: '7px 13px', borderRadius: '7px',
                            border: `1px solid ${sortBy === val ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                            background: sortBy === val ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: sortBy === val ? '#fff' : 'rgba(255,255,255,0.28)',
                            fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            {label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Grid */}
            <div style={{ padding: '48px clamp(24px, 5vw, 80px) 0', position: 'relative', zIndex: 2 }}>
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ paddingBottom: '133%', background: 'linear-gradient(110deg, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 70%)', backgroundSize: '200%', animation: 'shimmer 1.8s ease infinite' }} />
                                <div style={{ padding: '12px 14px 14px' }}>
                                    <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 7 }} />
                                    <div style={{ height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.025)', width: '55%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '120px 0', color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '3px', fontWeight: '700' }}>
                        COULD NOT LOAD RELEASES
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '120px 0', color: 'rgba(255,255,255,0.15)', fontSize: '11px', letterSpacing: '3px', fontWeight: '700' }}>
                        NO RELEASES FOUND
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '16px',
                    }}>
                        {filtered.map((release, i) => (
                            <ReleaseItem
                                key={release.id}
                                release={release}
                                index={i}
                                featured={false}
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                )}

                {!loading && !error && pagination.hasNextPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
                        <button
                            onClick={() => fetchReleases(pagination.page + 1, true)}
                            disabled={loadingMore}
                            style={{
                                padding: '13px 36px', background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px',
                                color: 'rgba(255,255,255,0.45)', fontSize: '10px',
                                fontWeight: '700', letterSpacing: '2px',
                                cursor: loadingMore ? 'wait' : 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                        >
                            {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                        </button>
                    </div>
                )}

                {/* Bottom fade */}
                <div style={{
                    position: 'relative', height: '120px', marginTop: '40px',
                    background: 'linear-gradient(to bottom, transparent, #050505)',
                    pointerEvents: 'none',
                }} />
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
