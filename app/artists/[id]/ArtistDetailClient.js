"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ReleaseCard from '@/app/components/ReleaseCard';
import BackgroundEffects from '@/app/components/BackgroundEffects';

export default function ArtistDetailClient({ artist, releases }) {
    if (!artist) {
        return (
            <div className="artist-detail-not-found">
                <h1>ARTIST NOT FOUND</h1>
                <Link href="/artists" className="artist-detail-back-link">
                    <ArrowLeft size={14} /> RETURN TO ROSTER
                </Link>
                <style jsx>{`
                    .artist-detail-not-found {
                        background: #050505;
                        color: #fff;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 0 5vw;
                    }
                    .artist-detail-not-found h1 {
                        font-size: clamp(28px, 5vw, 52px);
                        font-weight: 900;
                        letter-spacing: -0.04em;
                        color: rgba(255, 255, 255, 0.15);
                    }
                    .artist-detail-back-link {
                        color: rgba(255, 255, 255, 0.4);
                        font-size: 11px;
                        margin-top: 24px;
                        font-weight: 700;
                        letter-spacing: 2px;
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: color 0.2s ease;
                    }
                    .artist-detail-back-link:hover {
                        color: #fff;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="artist-detail-page">
            <BackgroundEffects />

            <div className="artist-detail-container">
                {/* Back link */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link href="/artists" className="artist-detail-back">
                        <ArrowLeft size={14} />
                        <span>ROSTER</span>
                    </Link>
                </motion.div>

                {/* Hero Section */}
                <header className="artist-detail-hero">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="artist-detail-image-wrapper"
                    >
                        <NextImage
                            src={artist.images?.[0]?.url || '/placeholder.png'}
                            alt={artist.name}
                            width={480}
                            height={480}
                            className="artist-detail-image"
                            priority
                        />
                        <div className="artist-detail-image-glow" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="artist-detail-meta"
                    >
                        <div className="artist-detail-label">
                            <div className="artist-detail-label-line" />
                            <span>ARTIST</span>
                        </div>

                        <h1 className="artist-detail-name">{artist.name}</h1>

                        <div className="artist-detail-stats">
                            <div className="artist-stat">
                                <span className="artist-stat-label">FOLLOWERS</span>
                                <span className="artist-stat-value">{artist.followers?.total?.toLocaleString('en-US') || '0'}</span>
                            </div>
                            {artist.monthlyListeners && (
                                <div className="artist-stat">
                                    <span className="artist-stat-label">MONTHLY LISTENERS</span>
                                    <span className="artist-stat-value highlight">{artist.monthlyListeners.toLocaleString('en-US')}</span>
                                </div>
                            )}
                            {artist.genres?.[0] && (
                                <div className="artist-stat">
                                    <span className="artist-stat-label">GENRE</span>
                                    <span className="artist-stat-value">{artist.genres[0].toUpperCase()}</span>
                                </div>
                            )}
                        </div>

                        <div className="artist-detail-actions">
                            <a
                                href={artist.external_urls?.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="artist-btn-primary"
                            >
                                SPOTIFY PROFILE
                                <ExternalLink size={13} />
                            </a>
                            <Link href="/artists" className="artist-btn-secondary">
                                ALL ARTISTS
                            </Link>
                        </div>
                    </motion.div>
                </header>

                {/* Releases Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 }}
                    className="artist-detail-releases"
                >
                    <div className="artist-releases-header">
                        <h2>
                            DISCOGRAPHY <span className="artist-releases-count">{releases.length}</span>
                        </h2>
                        <div className="artist-releases-line" />
                    </div>

                    {releases.length === 0 ? (
                        <div className="artist-releases-empty">
                            <p>NO RELEASES FOUND</p>
                        </div>
                    ) : (
                        <div className="artist-releases-grid">
                            {releases.map((release, i) => (
                                <motion.div
                                    key={release.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.04), duration: 0.4 }}
                                >
                                    <ReleaseCard
                                        id={release.id}
                                        fallbackTitle={release.name}
                                        fallbackArtist={release.artist || artist?.name}
                                        initialData={release}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </div>

            <style jsx>{`
                .artist-detail-page {
                    background: transparent;
                    color: #fff;
                    min-height: 100vh;
                    position: relative;
                    overflow-x: hidden;
                    padding-top: 100px;
                }

                .artist-detail-container {
                    position: relative;
                    z-index: 2;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 5vw 100px;
                }

                .artist-detail-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-decoration: none;
                    margin-bottom: 40px;
                    transition: color 0.2s ease;
                    padding: 8px 0;
                }

                .artist-detail-back:hover {
                    color: rgba(255, 255, 255, 0.7);
                }

                .artist-detail-hero {
                    display: flex;
                    gap: 56px;
                    align-items: flex-start;
                    margin-bottom: 80px;
                }

                .artist-detail-image-wrapper {
                    width: 300px;
                    height: 300px;
                    border-radius: 20px;
                    overflow: hidden;
                    flex-shrink: 0;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(255, 255, 255, 0.02);
                }

                .artist-detail-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: brightness(0.95) contrast(1.05);
                }

                .artist-detail-image-glow {
                    position: absolute;
                    bottom: -40%;
                    left: -20%;
                    right: -20%;
                    height: 80%;
                    background: radial-gradient(ellipse, rgba(255,255,255,0.04), transparent 70%);
                    pointer-events: none;
                }

                .artist-detail-meta {
                    flex: 1;
                    min-width: 0;
                    padding-top: 10px;
                }

                .artist-detail-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .artist-detail-label-line {
                    width: 28px;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.25);
                }

                .artist-detail-label span {
                    font-size: 10px;
                    letter-spacing: 4px;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 700;
                }

                .artist-detail-name {
                    font-size: clamp(36px, 6vw, 80px);
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    line-height: 0.95;
                    text-transform: uppercase;
                    margin-bottom: 28px;
                }

                .artist-detail-stats {
                    display: flex;
                    gap: 36px;
                    flex-wrap: wrap;
                    margin-bottom: 36px;
                }

                .artist-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .artist-stat-label {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.2);
                    font-weight: 700;
                    letter-spacing: 2px;
                }

                .artist-stat-value {
                    font-size: 14px;
                    color: #fff;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }

                .artist-stat-value.highlight {
                    color: rgba(255, 255, 255, 0.7);
                }

                .artist-detail-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .artist-btn-primary {
                    padding: 14px 32px;
                    font-size: 11px;
                    text-decoration: none;
                    background: #fff;
                    color: #000;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .artist-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px rgba(255, 255, 255, 0.1);
                }

                .artist-btn-secondary {
                    padding: 14px 28px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-decoration: none;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }

                .artist-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }

                .artist-detail-releases {
                    margin-top: 20px;
                }

                .artist-releases-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 36px;
                }

                .artist-releases-header h2 {
                    font-size: 12px;
                    letter-spacing: 4px;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.25);
                    white-space: nowrap;
                }

                .artist-releases-count {
                    color: rgba(255, 255, 255, 0.5);
                    margin-left: 4px;
                }

                .artist-releases-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.04);
                }

                .artist-releases-empty {
                    padding: 80px;
                    text-align: center;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 16px;
                }

                .artist-releases-empty p {
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                }

                .artist-releases-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 24px;
                }

                @media (max-width: 800px) {
                    .artist-detail-hero {
                        flex-direction: column;
                        gap: 32px;
                        align-items: center;
                        text-align: center;
                    }

                    .artist-detail-image-wrapper {
                        width: 240px;
                        height: 240px;
                    }

                    .artist-detail-label {
                        justify-content: center;
                    }

                    .artist-detail-stats {
                        justify-content: center;
                    }

                    .artist-detail-actions {
                        justify-content: center;
                    }

                    .artist-detail-name {
                        font-size: clamp(28px, 8vw, 48px);
                    }
                }

                @media (max-width: 480px) {
                    .artist-detail-image-wrapper {
                        width: 200px;
                        height: 200px;
                        border-radius: 16px;
                    }

                    .artist-btn-primary,
                    .artist-btn-secondary {
                        padding: 12px 24px;
                        font-size: 10px;
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
