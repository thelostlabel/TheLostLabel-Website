"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function ReleasesPage() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [expandedAlbum, setExpandedAlbum] = useState(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            mouseX.set(clientX);
            mouseY.set(clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    async function fetchAllReleases() {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`/api/releases`);
            const data = await res.json();
            if (data.releases) {
                setAlbums(data.releases);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAllReleases();
    }, []);

    const filteredAlbums = useMemo(() => {
        let result = [...albums];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(q) ||
                (a.artists && a.artists.some(art => art.name.toLowerCase().includes(q))) ||
                (a.artist && a.artist.toLowerCase().includes(q))
            );
        }
        if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }, [albums, searchQuery, sortBy]);

    const glassStyle = {
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        overflow: 'hidden'
    };

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '100px' }}>
            {/* Noise Texture Filter */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                opacity: 0.04,
                filter: 'url(#noiseFilter)'
            }} />

            {/* Grid Background Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.6
            }} />

            {/* Enhanced Ambient Glows */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
                <motion.div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    x: useTransform(springX, [0, 2000], [-50, 50]),
                    y: useTransform(springY, [0, 1000], [-30, 30])
                }} />
                <motion.div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
                    filter: 'blur(120px)',
                    x: useTransform(springX, [0, 2000], [30, -30]),
                    y: useTransform(springY, [0, 1000], [20, -20])
                }} />
            </div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                <header style={{ marginBottom: '60px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
                                    <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', fontWeight: '900' }}>CATALOG</span>
                                </div>
                                <h1 style={{
                                    fontSize: 'clamp(40px, 8vw, 80px)',
                                    fontWeight: '900',
                                    letterSpacing: '-0.04em',
                                    lineHeight: '0.9',
                                    textTransform: 'uppercase'
                                }}>
                                    FULL <span style={{ color: 'rgba(255,255,255,0.1)' }}>DISCOGRAPHY</span>
                                </h1>
                                <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginTop: '20px' }}>
                                    {loading ? 'SYNCING_RELEASES...' : error ? 'SYNC_FAILED' : `${filteredAlbums.length} CURATED PROJECTS`}
                                </p>
                            </div>
                            <Link href="/" style={{ fontSize: '11px', fontWeight: '900', color: '#666', letterSpacing: '2px', textDecoration: 'none' }}>← RETURN HOME</Link>
                        </div>
                    </motion.div>
                </header>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}
                >
                    <input
                        type="text"
                        placeholder="SEARCH ALBUMS OR ARTISTS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '250px',
                            padding: '16px 25px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '1px'
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '16px 25px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="date">NEWEST FIRST</option>
                        <option value="name">ALPHABETICAL (A-Z)</option>
                    </select>
                </motion.div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{ ...glassStyle, height: '400px', opacity: 0.1 }}></div>
                        ))}
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                        <h2 style={{ fontSize: '12px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px', fontWeight: '900' }}>CONNECTION_LOST</h2>
                        <button onClick={fetchAllReleases} className="glow-button" style={{ padding: '15px 40px', fontSize: '11px' }}>RE-SYNC CATALOG</button>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}
                    >
                        {filteredAlbums.map(album => (
                            <motion.div
                                key={album.id}
                                variants={{
                                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                                    visible: { opacity: 1, y: 0, scale: 1 }
                                }}
                                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                style={{
                                    ...glassStyle,
                                    cursor: 'pointer'
                                }}
                                onClick={() => setExpandedAlbum(expandedAlbum === album.id ? null : album.id)}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                                        <img
                                            src={album.image || '/placeholder.png'}
                                            alt={album.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                            className="release-image"
                                        />
                                    </div>
                                    <a
                                        href={album.spotify_url}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            bottom: '20px',
                                            right: '20px',
                                            background: '#1DB954',
                                            color: '#000',
                                            padding: '8px 16px',
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            borderRadius: '30px',
                                            textDecoration: 'none',
                                            letterSpacing: '1px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        LISTEN ON SPOTIFY
                                    </a>
                                </div>
                                <div style={{ padding: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '8px', color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {album.name}
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px', marginBottom: '5px' }}>
                                        {album.artists?.map(a => a.name).join(', ') || album.artist}
                                    </p>
                                    <p style={{ fontSize: '10px', color: '#444', fontWeight: '800' }}>{new Date(album.release_date).getFullYear()}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {filteredAlbums.length === 0 && !loading && !error && (
                    <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                        <p style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#444' }}>SEARCH_EMPTY: NO RELEASES FOUND</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .release-image:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
