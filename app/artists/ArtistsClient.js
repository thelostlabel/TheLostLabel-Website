"use client";
import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Mic2 } from "lucide-react";
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';

import BackgroundEffects from "../components/BackgroundEffects";

const TypewriterText = ({ text = "", delay = 0, style = {}, className = "" }) => {
    return (
        <motion.span
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.05,
                        delayChildren: delay,
                    }
                },
                hidden: {}
            }}
            style={{ display: "inline-block", ...style }}
            className={className}
        >
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    variants={{
                        hidden: { opacity: 0, display: "none" },
                        visible: { opacity: 1, display: "inline-block" }
                    }}
                    style={{ whiteSpace: "pre" }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
};

export default function ArtistsPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [introDone, setIntroDone] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sortBy, setSortBy] = useState('listeners');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

        setTimeout(() => {
            setIntroDone(true);
        }, 1500);

    }, []);

    const filteredArtists = useMemo(() => {
        let result = [...artists];
        if (debouncedQuery) {
            const q = debouncedQuery.toLowerCase();
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
    }, [artists, debouncedQuery, sortBy]);

    return (
        <>
            <AnimatePresence>
                {(loading || !introDone) && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "-100%" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "#050505", zIndex: 9999,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            overflow: "hidden"
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-2px", color: "#FFFFFF" }}
                        >
                            LOST.
                        </motion.div>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "200px" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            style={{ height: "2px", background: "rgba(255,255,255,0.45)", marginTop: "24px", borderRadius: "2px" }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ background: 'transparent', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '100px' }}>
                <BackgroundEffects />

                {/* Dynamic Progress Bar */}
                <motion.div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
                        background: 'rgba(229,231,235,0.9)', transformOrigin: '0%', zIndex: 2000, scaleX
                    }}
                />

                <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                    <header style={{ marginBottom: '60px' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 40 }}
                                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    style={{ height: '1px', background: 'rgba(229,231,235,0.8)' }}
                                ></motion.div>
                                <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'rgba(229,231,235,0.9)', fontWeight: '900' }}>DISCOVER</span>
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(40px, 8vw, 80px)',
                                fontWeight: '900',
                                letterSpacing: '-0.04em',
                                lineHeight: '0.9',
                                textTransform: 'uppercase',
                                display: 'flex', flexWrap: 'wrap', gap: '15px'
                            }}>
                                <span>LABEL</span> <span style={{ color: 'rgba(255,255,255,0.1)' }}><TypewriterText text="ROSTER" delay={0.6} /></span>
                            </h1>
                            <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginTop: '20px' }}>
                                {loading ? 'CATALOG_SYNCING...' : error ? 'SYNC_FAILED' : `${filteredArtists.length} INDEPENDENT ARTISTS`}
                            </p>
                        </motion.div>
                    </header>

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                                <div key={i} style={{ height: '350px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '100px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h2 style={{ fontSize: '12px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px', fontWeight: '900' }}>DATA_SYNC_ERROR</h2>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredArtists.map(artist => (
                                    <motion.div
                                        key={artist.id}
                                        layout
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={{
                                            hidden: { opacity: 0, y: 20, filter: "blur(15px)" },
                                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                                            exit: { opacity: 0, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.2 } }
                                        }}
                                        whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                    >
                                        <Link
                                            href={`/artists/${artist.id}`}
                                            className="artist-card-brutalist"
                                            style={{
                                                padding: '40px 24px',
                                                textAlign: 'center',
                                                display: 'block',
                                                textDecoration: 'none',
                                                height: '100%',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                background: 'rgba(255,255,255,0.02)',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '200px',
                                                height: '200px',
                                                margin: '0 auto 25px',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.02)',
                                                position: 'relative'
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
                                                <p style={{ fontSize: '10px', color: 'rgba(229,231,235,0.9)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
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
                                                        borderRadius: '0px',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        color: '#fff',
                                                        letterSpacing: '1px'
                                                    }}>
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {filteredArtists.length === 0 && !loading && !error && (
                        <div style={{ textAlign: 'center', padding: '100px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                            <p style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#444' }}>SEARCH_EMPTY: NO ARTISTS MATCHED</p>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .artist-card-brutalist:hover {
                    border-color: rgba(255,255,255,0.5) !important;
                    background: rgba(255,255,255,0.05) !important;
                }
                .artist-card-brutalist:hover .artist-image {
                    transform: scale(1.05);
                }
                .artist-image {
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </>
    );
}
