"use client";
import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Mic2 } from "lucide-react";
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';

import BackgroundEffects from "../components/BackgroundEffects";

export default function ArtistsPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('listeners');

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
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

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '100px' }}>
            <BackgroundEffects />

            {/* Dynamic Progress Bar */}
            <motion.div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
                    background: 'var(--accent)', transformOrigin: '0%', zIndex: 2000, scaleX
                }}
            />

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
                            <div key={i} className="glass-premium" style={{ height: '350px', opacity: 0.1 }}></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="glass-premium" style={{ textAlign: 'center', padding: '100px' }}>
                        <h2 style={{ fontSize: '12px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px', fontWeight: '900' }}>DATA_SYNC_ERROR</h2>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
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
                                    className="glass-premium"
                                    style={{
                                        padding: '35px',
                                        textAlign: 'center',
                                        display: 'block',
                                        textDecoration: 'none',
                                        height: '100%',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '160px',
                                        height: '160px',
                                        margin: '0 auto 25px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.02)',
                                        position: 'relative',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                    }}>
                                        <NextImage
                                            src={artist.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'}
                                            alt={artist.name}
                                            width={400}
                                            height={400}
                                            className="artist-image"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
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
                                                fontSize: '9px',
                                                padding: '6px 12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '20px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                color: '#888',
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
                    <div className="glass-premium" style={{ textAlign: 'center', padding: '100px' }}>
                        <p style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#444' }}>SEARCH_EMPTY: NO ARTISTS MATCHED</p>
                    </div>
                )}
            </div>
        </div>
    );
}
