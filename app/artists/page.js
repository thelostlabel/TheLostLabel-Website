"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';

export default function ArtistsPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('listeners');

    // Scroll progress for dynamic progress bar
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Mouse tracking for reactive ambient glows
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    async function fetchRoster() {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`/api/artists`);
            const data = await res.json();
            if (data.artists) {
                setArtists(data.artists);
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
        fetchRoster();
    }, []);

    const filteredArtists = useMemo(() => {
        let result = [...artists];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a => a.name.toLowerCase().includes(q));
        }
        if (sortBy === 'listeners') {
            result.sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0));
        } else if (sortBy === 'followers') {
            result.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }, [artists, searchQuery, sortBy]);

    const glassStyle = {
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        overflow: 'hidden'
    };

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '100px' }}>
            {/* Dynamic Progress Bar */}
            <motion.div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--accent)',
                    transformOrigin: '0%',
                    zIndex: 2000,
                    scaleX
                }}
            />

            {/* Noise Texture Filter */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                opacity: 0.04,
                filter: 'url(#noiseFilter)'
            }} />

            {/* Mouse-Reactive Ambient Glows */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
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
                    background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)',
                    filter: 'blur(120px)',
                    x: useTransform(springX, [0, 2000], [30, -30]),
                    y: useTransform(springY, [0, 1000], [20, -20])
                }} />
            </div>

            {/* Grid Background Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.6
            }} />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                <header style={{ marginBottom: '60px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
                            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', fontWeight: '900' }}>DISCOVER</span>
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(40px, 8vw, 80px)',
                            fontWeight: '900',
                            letterSpacing: '-0.04em',
                            lineHeight: '0.9',
                            textTransform: 'uppercase'
                        }}>
                            LABEL <span style={{ color: 'rgba(255,255,255,0.1)' }}>ROSTER</span>
                        </h1>
                        <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginTop: '20px' }}>
                            {loading ? 'CATALOG_SYNCING...' : error ? 'SYNC_FAILED' : `${filteredArtists.length} INDEPENDENT ARTISTS`}
                        </p>
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
                        placeholder="SEARCH ARTISTS..."
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
                        <option value="listeners">BY MONTHLY LISTENERS</option>
                        <option value="followers">BY FOLLOWERS</option>
                        <option value="name">BY NAME (A-Z)</option>
                    </select>
                </motion.div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} style={{ ...glassStyle, height: '350px', opacity: 0.1 }}></div>
                        ))}
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                        <h2 style={{ fontSize: '12px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px', fontWeight: '900' }}>DATA_SYNC_ERROR</h2>
                        <button onClick={fetchRoster} className="glow-button" style={{ padding: '15px 40px', fontSize: '11px' }}>RETRY CONNECTION</button>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}
                    >
                        {filteredArtists.map(artist => (
                            <motion.div
                                key={artist.id}
                                variants={{
                                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                                    visible: { opacity: 1, y: 0, scale: 1 }
                                }}
                                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            >
                                <Link
                                    href={`/artists/${artist.id}`}
                                    style={{
                                        ...glassStyle,
                                        padding: '35px',
                                        textAlign: 'center',
                                        display: 'block',
                                        textDecoration: 'none',
                                        height: '100%',
                                        transition: 'border-color 0.3s'
                                    }}
                                    className="artist-card-hover"
                                >
                                    <div style={{
                                        width: '160px',
                                        height: '160px',
                                        margin: '0 auto 25px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.02)',
                                        position: 'relative'
                                    }}>
                                        <img
                                            src={artist.image || '/placeholder.png'}
                                            alt={artist.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px', color: '#fff', letterSpacing: '-0.02em' }}>
                                        {artist.name}
                                    </h3>
                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                            {artist.monthlyListeners?.toLocaleString() || 0} Listeners
                                        </p>
                                        <p style={{ fontSize: '9px', color: '#444', fontWeight: '800', marginTop: '5px', letterSpacing: '1px' }}>
                                            {artist.followers?.toLocaleString() || 0} Followers
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {artist.genres?.slice(0, 2).map(genre => (
                                            <span key={genre} style={{
                                                fontSize: '8px',
                                                padding: '4px 10px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '4px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                color: '#666',
                                                letterSpacing: '1px'
                                            }}>
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {filteredArtists.length === 0 && !loading && !error && (
                    <div style={{ textAlign: 'center', padding: '100px', ...glassStyle }}>
                        <p style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#444' }}>SEARCH_EMPTY: NO ARTISTS MATCHED</p>
                    </div>
                )}
            </div>
        </div>
    );
}
