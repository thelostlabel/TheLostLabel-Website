"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { toReleaseSlug } from '@/lib/release-slug';

function ReleaseItem({ release, index }) {
    const [hovered, setHovered] = useState(false);
    const artistName = release.artists?.map(a => a.name).join(', ') || release.artist || release.artistName || '';
    const slug = toReleaseSlug(release.name, artistName, release.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
            layout
        >
            <Link href={`/releases/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#0a0a0a',
                        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                        transition: 'border-color 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s',
                        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                    }}
                >
                    {/* Cover art */}
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#111' }}>
                        {release.image ? (
                            <NextImage
                                src={release.image}
                                alt={release.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
                            />
                        ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                                <span style={{ fontSize: '32px', opacity: 0.2 }}>♪</span>
                            </div>
                        )}
                        {/* Overlay on hover */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                            opacity: hovered ? 1 : 0,
                            transition: 'opacity 0.3s',
                        }} />
                        {/* Popularity badge */}
                        {release.popularity > 60 && (
                            <div style={{
                                position: 'absolute', top: 10, right: 10,
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '999px',
                                padding: '3px 10px',
                                fontSize: '9px',
                                fontWeight: '900',
                                letterSpacing: '1.5px',
                                color: 'rgba(255,255,255,0.7)',
                            }}>
                                #{release.chartPosition || Math.round(100 - release.popularity / 10)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px 16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {release.name}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {artistName}
                        </p>
                        {release.release_date && (
                            <p style={{ margin: '6px 0 0', fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>
                                {new Date(release.release_date).getFullYear()}
                            </p>
                        )}
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
    const [revealed, setRevealed] = useState(false);
    const heroRef = useRef(null);
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const heroY = useTransform(scrollY, [0, 300], [0, -60]);

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
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        } finally {
            if (append) setLoadingMore(false);
            else setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReleases(); }, [fetchReleases]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 280);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        const t = setTimeout(() => setRevealed(true), 600);
        return () => clearTimeout(t);
    }, []);

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
        <div style={{ background: '#050505', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>

            {/* Intro reveal */}
            <AnimatePresence>
                {!revealed && (
                    <motion.div
                        key="reveal"
                        exit={{ opacity: 0, y: '-100%' }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, filter: 'blur(20px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.7 }}
                            style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '-3px', color: '#fff' }}
                        >
                            LOST.
                        </motion.div>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '180px' }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
                            style={{ height: '1.5px', background: 'rgba(255,255,255,0.3)', marginTop: '20px', borderRadius: '2px' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grain overlay */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
                mixBlendMode: 'overlay',
            }} />

            {/* Hero header */}
            <motion.div
                ref={heroRef}
                style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 2 }}
            >
                <div style={{ padding: 'clamp(120px, 18vh, 200px) clamp(24px, 5vw, 80px) 80px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 60, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <Link href="/" style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}
                            >
                                ← HOME
                            </Link>
                            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                                {loading ? '...' : `${pagination.total || filtered.length} RELEASES`}
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(52px, 10vw, 120px)',
                            fontWeight: '900',
                            letterSpacing: '-0.05em',
                            lineHeight: 0.88,
                            margin: 0,
                            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.25) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            CATALOG
                        </h1>
                    </motion.div>
                </div>
            </motion.div>

            {/* Sticky controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.1 }}
                style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    background: 'rgba(5,5,5,0.85)',
                    backdropFilter: 'blur(24px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '14px clamp(24px, 5vw, 80px)',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
                }}
            >
                <input
                    type="text"
                    placeholder="Search releases or artists..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1, minWidth: '200px',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '10px',
                        color: '#fff', fontSize: '12px', fontWeight: '500',
                        outline: 'none',
                    }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                    {[['popularity', 'Popular'], ['date', 'Newest'], ['name', 'A–Z']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setSortBy(val)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${sortBy === val ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                background: sortBy === val ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: sortBy === val ? '#fff' : 'rgba(255,255,255,0.3)',
                                fontSize: '10px', fontWeight: '700', letterSpacing: '1px',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Grid */}
            <div style={{ padding: '40px clamp(24px, 5vw, 80px) 100px', position: 'relative', zIndex: 2 }}>
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ paddingBottom: '100%', background: 'rgba(255,255,255,0.02)' }} />
                                <div style={{ padding: '14px 16px 16px' }}>
                                    <div style={{ height: 13, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />
                                    <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.025)', width: '60%' }} />
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
                    <motion.div
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map((release, i) => (
                                <ReleaseItem key={release.id} release={release} index={i} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && !error && pagination.hasNextPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
                        <button
                            onClick={() => fetchReleases(pagination.page + 1, true)}
                            disabled={loadingMore}
                            style={{
                                padding: '14px 36px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '999px',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
                                cursor: loadingMore ? 'wait' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#fff'; }}
                            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
                        >
                            {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
