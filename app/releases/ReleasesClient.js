"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

import BackgroundEffects from "../components/BackgroundEffects";
import ReleaseCard from "../components/ReleaseCard";

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

export default function ReleasesPage() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [introDone, setIntroDone] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sortBy, setSortBy] = useState('popularity');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
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
        fetchAllReleases();

        setTimeout(() => {
            setIntroDone(true);
        }, 1500);

    }, []);

    const filteredAlbums = useMemo(() => {
        let result = [...albums];
        if (debouncedQuery) {
            const q = debouncedQuery.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(q) ||
                (a.baseTitle && a.baseTitle.toLowerCase().includes(q)) ||
                (a.artists && a.artists.some(art => art.name.toLowerCase().includes(q))) ||
                (a.artist && a.artist.toLowerCase().includes(q))
            );
        }
        if (sortBy === 'popularity') {
            result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        } else if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }, [albums, debouncedQuery, sortBy]);

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
                            style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-2px", color: "var(--accent)" }}
                        >
                            LOST.
                        </motion.div>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "200px" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            style={{ height: "2px", background: "rgba(158,240,26,0.5)", marginTop: "24px", borderRadius: "2px" }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ background: 'transparent', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '100px' }}>
                <BackgroundEffects />

                <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                    <header style={{ marginBottom: '60px' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: 40 }}
                                            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ height: '1px', background: 'var(--accent)' }}
                                        ></motion.div>
                                        <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', fontWeight: '900' }}>CATALOG</span>
                                    </div>
                                    <h1 style={{
                                        fontSize: 'clamp(40px, 8vw, 80px)',
                                        fontWeight: '900',
                                        letterSpacing: '-0.04em',
                                        lineHeight: '0.9',
                                        textTransform: 'uppercase',
                                        display: 'flex', flexWrap: 'wrap', gap: '15px'
                                    }}>
                                        <span>FULL</span> <span style={{ color: 'rgba(255,255,255,0.1)' }}><TypewriterText text="DISCOGRAPHY" delay={0.6} /></span>
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
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                            <option value="popularity">MOST POPULAR</option>
                            <option value="date">NEWEST FIRST</option>
                            <option value="name">ALPHABETICAL (A-Z)</option>
                        </select>
                    </motion.div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="glass-premium" style={{ height: '400px', opacity: 0.1 }}></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="glass-premium" style={{ textAlign: 'center', padding: '100px' }}>
                            <h2 style={{ fontSize: '12px', letterSpacing: '4px', color: '#ff4444', marginBottom: '20px', fontWeight: '900' }}>CONNECTION_LOST</h2>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredAlbums.map(album => (
                                    <motion.div
                                        key={album.id}
                                        layout
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={{
                                            hidden: { opacity: 0, y: 20, filter: "blur(15px)" },
                                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                                            exit: { opacity: 0, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.2 } }
                                        }}
                                    >
                                        <ReleaseCard id={album.id} initialData={album} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {filteredAlbums.length === 0 && !loading && !error && (
                        <div className="glass-premium" style={{ textAlign: 'center', padding: '100px' }}>
                            <p style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '900', color: '#444' }}>SEARCH_EMPTY: NO RELEASES FOUND</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
