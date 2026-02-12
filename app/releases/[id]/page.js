"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Clock, ExternalLink, ChevronLeft, Music } from 'lucide-react';
import { usePlayer } from '@/app/components/PlayerContext';
import BackgroundEffects from '@/app/components/BackgroundEffects';

export default function ReleaseDetailPage() {
    const params = useParams();
    const releaseId = params.id;
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchRelease() {
            try {
                let baseRelease = null;
                const baseRes = await fetch(`/api/releases/${releaseId}`);
                if (baseRes.ok) {
                    baseRelease = await baseRes.json();
                }

                const buildFromTrack = (track) => ({
                    id: baseRelease?.id || releaseId,
                    name: track.name || baseRelease?.name,
                    image: track.image || baseRelease?.image,
                    artists: track.artists || baseRelease?.artists || (track.artist ? [{ id: 'unknown', name: track.artist }] : []),
                    release_date: track.release_date || baseRelease?.release_date,
                    total_tracks: 1,
                    tracks: [
                        {
                            id: track.id || releaseId,
                            name: track.name,
                            artists: track.artists || (track.artist ? [{ id: 'unknown', name: track.artist }] : []),
                            duration_ms: track.duration_ms,
                            preview_url: track.preview_url
                        }
                    ],
                    spotify_url: track.spotify_url || baseRelease?.spotify_url,
                    versions: baseRelease?.versions || []
                });

                const resolveSpotifyEndpoint = (spotifyUrl) => {
                    if (!spotifyUrl) return null;
                    const albumMatch = spotifyUrl.match(/album\/([a-zA-Z0-9]+)/);
                    if (albumMatch?.[1]) return `/api/spotify/album/${albumMatch[1]}`;
                    const trackMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
                    if (trackMatch?.[1]) return `/api/spotify/track/${trackMatch[1]}`;
                    return null;
                };

                const spotifyEndpoint = resolveSpotifyEndpoint(baseRelease?.spotify_url);
                if (spotifyEndpoint) {
                    const res = await fetch(spotifyEndpoint);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.tracks) {
                            setRelease({
                                ...baseRelease,
                                ...data,
                                artists: data.artists || baseRelease?.artists
                            });
                            return;
                        }
                        setRelease(buildFromTrack(data));
                        return;
                    }
                }

                let res = await fetch(`/api/spotify/album/${releaseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRelease({ ...baseRelease, ...data, artists: data.artists || baseRelease?.artists });
                    return;
                }

                const trackRes = await fetch(`/api/spotify/track/${releaseId}`);
                if (!trackRes.ok) {
                    if (baseRelease) {
                        setRelease({
                            ...baseRelease,
                            total_tracks: baseRelease.total_tracks || 1,
                            tracks: baseRelease.preview_url ? [{
                                id: baseRelease.id,
                                name: baseRelease.name,
                                artists: baseRelease.artists,
                                duration_ms: 0,
                                preview_url: baseRelease.preview_url
                            }] : []
                        });
                        return;
                    }
                    throw new Error('Release not found');
                }
                const track = await trackRes.json();
                setRelease(buildFromTrack(track));
                // Post-process to merge versions into tracks if this is a single-disc style release
                setRelease(prev => {
                    if (!prev || !prev.versions || prev.versions.length <= 1) return prev;

                    const existingTrackIds = new Set(prev.tracks?.map(t => t.id) || []);
                    const versionTracks = prev.versions
                        .filter(v => v.id !== prev.id && v.id !== releaseId && !existingTrackIds.has(v.id))
                        .map(v => ({
                            id: v.id,
                            name: v.name,
                            artists: v.artists || prev.artists,
                            duration_ms: 0, // We don't have this for all versions easily
                            preview_url: v.preview_url,
                            is_version: true
                        }));

                    return {
                        ...prev,
                        tracks: [...(prev.tracks || []), ...versionTracks],
                        total_tracks: (prev.tracks?.length || 0) + versionTracks.length
                    };
                });

            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        if (releaseId) fetchRelease();
    }, [releaseId]);

    const formatDuration = (ms) => {
        const min = Math.floor(ms / 60000);
        const sec = ((ms % 60000) / 1000).toFixed(0);
        return `${min}:${sec.padStart(2, '0')}`;
    };
    const releaseDateLabel = release?.release_date
        ? new Date(release.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';
    const firstPreview = release?.tracks?.find((t) => t.preview_url);
    const formatArtists = (artists) => artists?.map(a => a.name).join(", ") || 'Unknown Artist';

    if (loading) {
        return (
            <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}
                >
                    RETRIEVING_LOST_ASSETS
                </motion.div>
            </div>
        );
    }

    if (error || !release) {
        return (
            <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: '900', color: '#ff4444' }}>LOST_IN_VOID</h1>
                <Link href="/releases" style={{ color: 'var(--accent)', marginTop: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>
                    ← RETURN_TO_CATALOG
                </Link>
            </div>
        );
    }

    const normalizedImage = release.image?.startsWith('private/')
        ? `/api/files/release/${release.id}`
        : release.image;

    return (
        <div style={{ background: '#050607', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '110px' }}>
            <BackgroundEffects />

            <section className="release-hero">
                <div
                    className="hero-backdrop"
                    style={normalizedImage ? { backgroundImage: `url(${normalizedImage})` } : undefined}
                />
                <div className="hero-inner">
                    <Link href="/releases" className="back-link">
                        <ChevronLeft size={16} /> BACK_TO_CATALOG
                    </Link>

                    <div className="hero-grid">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="cover-wrap"
                            style={{ borderRadius: '32px', overflow: 'hidden' }}
                        >
                            <NextImage
                                src={normalizedImage || '/placeholder.png'}
                                alt={release.name}
                                width={420}
                                height={420}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '32px' }}
                                priority
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="meta-card"
                        >
                            <div className="meta-kicker">
                                <span className="kicker-line" />
                                <span>{release?.type?.toUpperCase() || 'RELEASE'} DATA</span>
                            </div>
                            <h1 className="release-title">{release.name}</h1>

                            <div className="artist-list">
                                {release.artists?.map((art, idx) => (
                                    <span key={art.id} className="artist-pill">
                                        <Link href={`/artists/${art.id}`}>{art.name}</Link>
                                        {idx < release.artists.length - 1 && <span className="artist-sep">•</span>}
                                    </span>
                                ))}
                            </div>

                            <div className="stat-row">
                                <div>
                                    <div className="stat-label">RELEASE DATE</div>
                                    <div className="stat-value">{releaseDateLabel}</div>
                                </div>
                                <div>
                                    <div className="stat-label">TRACK COUNT</div>
                                    <div className="stat-value">{release.total_tracks} TRACKS</div>
                                </div>
                                {firstPreview && (
                                    <div>
                                        <div className="stat-label">PREVIEW</div>
                                        <div className="stat-value">AVAILABLE</div>
                                    </div>
                                )}
                            </div>

                            <div className="action-row">
                                {firstPreview && (
                                    <button
                                        className="primary-btn"
                                        onClick={() => {
                                            playTrack({
                                                id: firstPreview.id,
                                                name: firstPreview.name,
                                                artist: formatArtists(firstPreview.artists),
                                                image: normalizedImage,
                                                previewUrl: firstPreview.preview_url
                                            });
                                        }}
                                    >
                                        <Play size={14} /> PLAY_PREVIEW
                                    </button>
                                )}
                                <a href={release.spotify_url} target="_blank" className="primary-btn glow-button" style={{ textDecoration: 'none' }}>
                                    <ExternalLink size={14} /> VIEW_ON_SPOTIFY
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '40px 5vw 100px' }}>
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="tracklist-header">
                        <h2>TRACKLIST</h2>
                        <div />
                    </div>

                    <div className="tracklist-panel">
                        {release.tracks?.map((track, index) => {
                            const isCurrent = currentTrack?.id === track.id;
                            const isActive = isCurrent && isPlaying;

                            return (
                                <div
                                    key={track.id}
                                    className="track-row"
                                    onClick={() => {
                                        if (track.preview_url) {
                                            playTrack({
                                                id: track.id,
                                                name: track.name,
                                                artist: track.artists,
                                                image: normalizedImage,
                                                previewUrl: track.preview_url
                                            });
                                        }
                                    }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '50px 1fr 120px 50px',
                                        alignItems: 'center',
                                        padding: '20px 26px',
                                        cursor: track.preview_url ? 'pointer' : 'default',
                                        borderBottom: index !== release.tracks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                        background: isCurrent ? 'rgba(245,197,66,0.08)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ opacity: 0.3, fontSize: '11px', fontWeight: '900' }}>{String(index + 1).padStart(2, '0')}</div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: isCurrent ? 'var(--accent)' : '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {track.name}
                                            {isActive && (
                                                <motion.div
                                                    animate={{ height: [4, 12, 4] }}
                                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                                    style={{ width: '2px', background: 'var(--accent)' }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {track.artists?.map((art, idx) => (
                                                <span key={art.id} style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Link
                                                        href={`/artists/${art.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                                        onMouseEnter={(e) => e.target.style.color = '#888'}
                                                        onMouseLeave={(e) => e.target.style.color = 'inherit'}
                                                    >
                                                        {art.name}
                                                    </Link>
                                                    {idx < track.artists.length - 1 && <span>,</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666', fontWeight: '800', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                        {track.duration_ms > 0 && (
                                            <>
                                                <Clock size={12} /> {formatDuration(track.duration_ms)}
                                            </>
                                        )}
                                        {track.is_version && (
                                            <span style={{ fontSize: '9px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '4px' }}>
                                                VERSION
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {track.preview_url ? (
                                            <div style={{ color: isCurrent ? 'var(--accent)' : '#444' }}>
                                                {isActive ? <Pause size={16} /> : <Play size={16} />}
                                            </div>
                                        ) : (
                                            <div style={{ color: 'rgba(255,255,255,0.05)' }}>
                                                <Music size={16} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.section>

            </div>

            <style jsx>{`
                .release-hero {
                    position: relative;
                    z-index: 1;
                    padding: 30px 0 20px;
                }
                .hero-backdrop {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(40px) saturate(1.2);
                    opacity: 0.18;
                    transform: scale(1.1);
                }
                .hero-inner {
                    position: relative;
                    z-index: 2;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 5vw;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #d7d7d7;
                    text-decoration: none;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    margin-bottom: 30px;
                    text-transform: uppercase;
                    padding: 10px 14px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    backdrop-filter: blur(8px);
                }
                .hero-grid {
                    display: grid;
                    grid-template-columns: 420px 1fr;
                    gap: 50px;
                    align-items: center;
                }
                .cover-wrap {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.7), 
                                inset 0 0 0 1px rgba(255,255,255,0.1),
                                0 0 0 1px rgba(255,255,255,0.05);
                    border: none;
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    /* Ensure child images also have the radius if transform/overflow is tricky */
                    mask-image: -webkit-radial-gradient(white, black);
                }
                .cover-wrap:hover {
                    transform: scale(1.03) translateY(-5px);
                    box-shadow: 0 50px 120px rgba(0,0,0,0.8), 
                                inset 0 0 0 1px rgba(255,255,255,0.2);
                }
                .meta-card {
                    background: rgba(12,12,14,0.72);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 26px;
                    padding: 30px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                    backdrop-filter: blur(24px);
                }
                .meta-kicker {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 9px;
                    letter-spacing: 4px;
                    color: var(--accent);
                    font-weight: 900;
                    margin-bottom: 16px;
                }
                .kicker-line {
                    width: 32px;
                    height: 1px;
                    background: var(--accent);
                }
                .release-title {
                    font-size: clamp(36px, 5vw, 64px);
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    line-height: 1;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }
                .artist-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 22px;
                }
                .artist-pill a {
                    color: #fff;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .artist-sep {
                    color: #444;
                    margin-left: 8px;
                }
                .stat-row {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .stat-label {
                    font-size: 9px;
                    color: #666;
                    font-weight: 900;
                    letter-spacing: 2px;
                    margin-bottom: 6px;
                }
                .stat-value {
                    font-size: 12px;
                    font-weight: 800;
                }
                .action-row {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .primary-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 12px 18px;
                    border-radius: 14px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .secondary-btn {
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                    padding: 12px 18px;
                    border-radius: 14px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }
                .tracklist-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .tracklist-header h2 {
                    font-size: 11px;
                    letter-spacing: 5px;
                    font-weight: 900;
                    color: #666;
                }
                .tracklist-header div {
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                }
                .tracklist-panel {
                    background: rgba(255,255,255,0.015);
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.06);
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.35);
                }
                @media (max-width: 980px) {
                    .hero-grid {
                        grid-template-columns: 1fr;
                    }
                    .cover-wrap {
                        max-width: 360px;
                    }
                    .stat-row {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 600px) {
                    .meta-card {
                        padding: 22px;
                    }
                    .stat-row {
                        grid-template-columns: 1fr;
                    }
                    .track-row {
                        grid-template-columns: 30px 1fr 90px 30px !important;
                    }
                }
                .track-row:hover {
                    background: rgba(255,255,255,0.03) !important;
                }
                .track-row:hover div {
                    color: #fff !important;
                }
                .track-row:hover .track-title {
                    color: var(--accent) !important;
                }
            `}</style>
        </div>
    );
}
