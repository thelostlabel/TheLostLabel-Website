"use client";
import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

import BackgroundEffects from "../components/BackgroundEffects";

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
                            className="artists-loader-title"
                        >
                            LOST.
                        </motion.div>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "120px" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="artists-loader-bar"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="artists-page">
                <BackgroundEffects />

                {/* Progress Bar */}
                <motion.div className="artists-progress" style={{ scaleX }} />

                <div className="artists-container">
                    {/* Header */}
                    <header className="artists-header">
                        <motion.div
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="artists-header-label">
                                <div className="artists-header-line" />
                                <span>DISCOVER</span>
                            </div>
                            <h1 className="artists-title">
                                <span>LABEL</span>
                                <span className="artists-title-dim">ROSTER</span>
                            </h1>
                            <p className="artists-count">
                                {loading ? 'SYNCING...' : error ? 'SYNC FAILED' : `${filteredArtists.length} ARTISTS`}
                            </p>
                        </motion.div>
                    </header>

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="artists-controls"
                    >
                        <div className="artists-search">
                            <Search size={15} className="artists-search-icon" />
                            <input
                                type="text"
                                placeholder="Search artists..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="artists-search-input"
                            />
                        </div>
                        <div className="artists-sort">
                            <SlidersHorizontal size={13} />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="artists-sort-select"
                            >
                                <option value="listeners">Monthly Listeners</option>
                                <option value="followers">Followers</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    {loading ? (
                        <div className="artists-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="artist-card-skeleton">
                                    <div className="skeleton-image" />
                                    <div className="skeleton-text" />
                                    <div className="skeleton-text short" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="artists-error">
                            <p>DATA SYNC ERROR</p>
                            <span>Please try refreshing the page</span>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            className="artists-grid"
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
                                            hidden: { opacity: 0, y: 24, scale: 0.96 },
                                            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                                            exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
                                        }}
                                    >
                                        <Link href={`/artists/${artist.id}`} className="artist-card">
                                            <div className="artist-card-image-wrapper">
                                                <NextImage
                                                    src={artist.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'}
                                                    alt={artist.name}
                                                    width={400}
                                                    height={400}
                                                    className="artist-card-image"
                                                />
                                                <div className="artist-card-image-overlay" />
                                            </div>
                                            <div className="artist-card-info">
                                                <h3 className="artist-card-name">{artist.name}</h3>
                                                <div className="artist-card-stats">
                                                    <span className="artist-card-listeners">
                                                        {artist.monthlyListeners?.toLocaleString() || 0} listeners
                                                    </span>
                                                    <span className="artist-card-dot" />
                                                    <span className="artist-card-followers">
                                                        {artist.followers?.toLocaleString() || 0} followers
                                                    </span>
                                                </div>
                                                {artist.genres?.length > 0 && (
                                                    <div className="artist-card-genres">
                                                        {artist.genres.slice(0, 2).map(genre => (
                                                            <span key={genre} className="artist-card-genre">
                                                                {genre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {filteredArtists.length === 0 && !loading && !error && (
                        <div className="artists-empty">
                            <p>NO ARTISTS FOUND</p>
                            <span>Try adjusting your search query</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .artists-page {
                    background: transparent;
                    color: #fff;
                    min-height: 100vh;
                    position: relative;
                    overflow-x: hidden;
                    padding-top: 100px;
                }

                .artists-loader-title {
                    font-size: 56px;
                    font-weight: 900;
                    letter-spacing: -2px;
                    color: #fff;
                }

                .artists-loader-bar {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.3);
                    margin-top: 24px;
                    border-radius: 2px;
                }

                .artists-progress {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.8);
                    transform-origin: 0%;
                    z-index: 2000;
                }

                .artists-container {
                    position: relative;
                    z-index: 2;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 5vw 100px;
                }

                .artists-header {
                    margin-bottom: 50px;
                }

                .artists-header-label {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 16px;
                }

                .artists-header-line {
                    width: 32px;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.3);
                }

                .artists-header-label span {
                    font-size: 10px;
                    letter-spacing: 4px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 700;
                }

                .artists-title {
                    font-size: clamp(42px, 7vw, 72px);
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    line-height: 0.95;
                    text-transform: uppercase;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .artists-title-dim {
                    color: rgba(255, 255, 255, 0.08);
                }

                .artists-count {
                    color: rgba(255, 255, 255, 0.25);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 3px;
                    margin-top: 18px;
                }

                .artists-controls {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 48px;
                    flex-wrap: wrap;
                }

                .artists-search {
                    flex: 1;
                    min-width: 240px;
                    position: relative;
                }

                .artists-search-icon {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.2);
                    pointer-events: none;
                }

                .artists-search-input {
                    width: 100%;
                    padding: 14px 20px 14px 48px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                    outline: none;
                    transition: all 0.25s ease;
                }

                .artists-search-input::placeholder {
                    color: rgba(255, 255, 255, 0.2);
                    font-weight: 500;
                }

                .artists-search-input:focus {
                    border-color: rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.03);
                }

                .artists-sort {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    color: rgba(255, 255, 255, 0.4);
                    transition: all 0.25s ease;
                }

                .artists-sort:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .artists-sort-select {
                    padding: 14px 0;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    cursor: pointer;
                    outline: none;
                    -webkit-appearance: none;
                }

                .artists-sort-select option {
                    background: #111;
                    color: #fff;
                }

                .artists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 24px;
                }

                .artist-card {
                    display: flex;
                    flex-direction: column;
                    text-decoration: none;
                    border-radius: 16px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .artist-card:hover {
                    border-color: rgba(255, 255, 255, 0.12);
                    background: rgba(255, 255, 255, 0.04);
                    transform: translateY(-6px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .artist-card-image-wrapper {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.02);
                }

                .artist-card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .artist-card:hover .artist-card-image {
                    transform: scale(1.06);
                }

                .artist-card-image-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
                    pointer-events: none;
                }

                .artist-card-info {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .artist-card-name {
                    font-size: 16px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.01em;
                    line-height: 1.2;
                }

                .artist-card-stats {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .artist-card-listeners {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 600;
                    letter-spacing: 0.02em;
                }

                .artist-card-dot {
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                }

                .artist-card-followers {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 600;
                    letter-spacing: 0.02em;
                }

                .artist-card-genres {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-top: 4px;
                }

                .artist-card-genre {
                    font-size: 9px;
                    padding: 5px 10px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 6px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 0.08em;
                }

                .artist-card-skeleton {
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    overflow: hidden;
                }

                .skeleton-image {
                    width: 100%;
                    aspect-ratio: 1;
                    background: linear-gradient(110deg, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 70%);
                    background-size: 200% 100%;
                    animation: shimmer 1.8s ease-in-out infinite;
                }

                .skeleton-text {
                    height: 14px;
                    margin: 16px 20px 0;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.04);
                    width: 60%;
                }

                .skeleton-text.short {
                    width: 40%;
                    height: 10px;
                    margin-bottom: 20px;
                    margin-top: 10px;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .artists-error,
                .artists-empty {
                    text-align: center;
                    padding: 80px 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                }

                .artists-error p,
                .artists-empty p {
                    font-size: 12px;
                    letter-spacing: 3px;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.3);
                    margin-bottom: 8px;
                }

                .artists-error span,
                .artists-empty span {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.15);
                    font-weight: 500;
                }

                @media (max-width: 640px) {
                    .artists-grid {
                        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                        gap: 14px;
                    }

                    .artist-card-info {
                        padding: 14px;
                    }

                    .artist-card-name {
                        font-size: 14px;
                    }

                    .artists-title {
                        font-size: clamp(32px, 10vw, 50px);
                    }
                }
            `}</style>
        </>
    );
}
