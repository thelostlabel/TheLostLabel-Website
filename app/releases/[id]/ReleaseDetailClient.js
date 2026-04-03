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
    const [introDone, setIntroDone] = useState(false);

    useEffect(() => {
        async function fetchRelease() {
            try {
                let baseRelease = null;
                const baseRes = await fetch(`/api/releases/${releaseId}`);
                if (baseRes.ok) {
                    baseRelease = await baseRes.json();
                }

                let finalRelease = null;

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
                            duration_ms: track.duration_ms || 0,
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

                // Strategy 1: Smart Endpoint Resolution
                const spotifyEndpoint = resolveSpotifyEndpoint(baseRelease?.spotify_url);
                if (spotifyEndpoint) {
                    const res = await fetch(spotifyEndpoint);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.tracks) {
                            finalRelease = {
                                ...baseRelease,
                                ...data,
                                artists: data.artists || baseRelease?.artists
                            };
                        } else {
                            finalRelease = buildFromTrack(data);
                        }
                    }
                }

                // Strategy 2: Explicit Album Fetch
                if (!finalRelease) {
                    let res = await fetch(`/api/spotify/album/${releaseId}`);
                    if (res.ok) {
                        const data = await res.json();
                        finalRelease = { ...baseRelease, ...data, artists: data.artists || baseRelease?.artists };
                    }
                }

                // Strategy 3: Explicit Track Fetch
                if (!finalRelease) {
                    const trackRes = await fetch(`/api/spotify/track/${releaseId}`);
                    if (trackRes.ok) {
                        const track = await trackRes.json();
                        finalRelease = buildFromTrack(track);
                    }
                }

                // Fallback: Use Database Data
                if (!finalRelease && baseRelease) {
                    // Create a track entry for the release itself so it appears in the list
                    const mainTrack = {
                        id: baseRelease.id,
                        name: baseRelease.name,
                        artists: baseRelease.artists || [],
                        duration_ms: 0,
                        preview_url: baseRelease.preview_url || null
                    };

                    finalRelease = {
                        ...baseRelease,
                        total_tracks: baseRelease.total_tracks || 1,
                        tracks: [mainTrack]
                    };
                }

                if (!finalRelease) throw new Error('Release not found');

                // Merge Versions
                if (finalRelease.versions && finalRelease.versions.length > 0) {
                    const existingTrackIds = new Set(finalRelease.tracks?.map(t => t.id) || []);
                    const existingTrackNames = new Set((finalRelease.tracks || []).map(t => t.name.trim().toLowerCase()));

                    // Filter duplicates (some versions might be the release itself)
                    const versionTracks = finalRelease.versions
                        .filter(v =>
                            v.id !== finalRelease.id &&
                            v.id !== releaseId &&
                            !existingTrackIds.has(v.id) &&
                            !existingTrackNames.has(v.name.trim().toLowerCase())
                        )
                        .map(v => ({
                            id: v.id,
                            name: v.name,
                            artists: v.artists || finalRelease.artists,
                            duration_ms: 0,
                            preview_url: v.preview_url,
                            is_version: true
                        }));

                    finalRelease.tracks = [...(finalRelease.tracks || []), ...versionTracks];
                    finalRelease.total_tracks = finalRelease.tracks.length;
                }

                setRelease(finalRelease);

            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        if (releaseId) fetchRelease();

        setTimeout(() => {
            setIntroDone(true);
        }, 1500);

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

    if (error || (!loading && !release)) {
        return (
            <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: '900', color: '#ff4444' }}>LOST_IN_VOID</h1>
                <Link href="/releases" style={{ color: 'rgba(229,231,235,0.9)', marginTop: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>
                    ← RETURN_TO_CATALOG
                </Link>
            </div>
        );
    }

    const normalizedImage = release?.image?.startsWith('private/')
        ? `/api/files/release/${release.id}`
        : release?.image;

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

            {release && (
                <div style={{ color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
                    <BackgroundEffects />

                    {/* Blurred album art ambient background */}
                    <div
                        className="hero-backdrop"
                        style={normalizedImage ? { backgroundImage: `url(${normalizedImage})` } : undefined}
                    />
                    <div className="hero-backdrop-gradient" />

                    <section className="release-hero">
                        <div className="hero-inner">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Link href="/releases" className="back-link">
                                    <ChevronLeft size={14} strokeWidth={3} /> CATALOG
                                </Link>
                            </motion.div>

                            <div className="hero-grid">
                                {/* Cover Art */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="cover-wrap"
                                >
                                    <NextImage
                                        src={normalizedImage || '/placeholder.png'}
                                        alt={release.name}
                                        width={800}
                                        height={800}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        priority
                                    />
                                    <div className="cover-glare" />
                                    {/* Reflection */}
                                    <div className="cover-reflection">
                                        <NextImage
                                            src={normalizedImage || '/placeholder.png'}
                                            alt=""
                                            width={400}
                                            height={400}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleY(-1)' }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Metadata */}
                                <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    className="meta-card"
                                >
                                    <div className="meta-kicker">
                                        <span className="kicker-dot" />
                                        <span>{release?.type?.toUpperCase() || 'RELEASE'}</span>
                                    </div>

                                    <h1 className="release-title">{release.name}</h1>

                                    <div className="artist-list">
                                        {release.artists?.map((art, idx) => (
                                            <span key={art.id} className="artist-pill">
                                                <Link href={`/artists/${art.id}`}>{art.name}</Link>
                                                {idx < release.artists.length - 1 && <span className="artist-sep">&</span>}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="stat-row">
                                        <div className="stat-chip">
                                            <Clock size={12} />
                                            <span>{releaseDateLabel}</span>
                                        </div>
                                        <div className="stat-chip">
                                            <Music size={12} />
                                            <span>{release.total_tracks} {release.total_tracks === 1 ? 'Track' : 'Tracks'}</span>
                                        </div>
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
                                                <Play size={14} fill="#000" />
                                                PLAY PREVIEW
                                            </button>
                                        )}
                                        {release.spotify_url && (
                                            <a href={release.spotify_url} target="_blank" rel="noopener noreferrer" className="secondary-btn">
                                                <ExternalLink size={14} /> OPEN IN SPOTIFY
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* Tracklist */}
                    <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '20px 5vw 120px' }}>
                        <motion.section
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="tracklist-header">
                                <div className="tracklist-kicker">TRACKLIST</div>
                                <div className="tracklist-count">{release.total_tracks} SONGS</div>
                            </div>

                            <div className="tracklist-panel">
                                {release.tracks?.map((track, index) => {
                                    const isCurrent = currentTrack?.id === track.id;
                                    const isActive = isCurrent && isPlaying;

                                    return (
                                        <motion.div
                                            key={track.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                                            className={`track-row ${isCurrent ? 'active' : ''} ${track.preview_url ? 'playable' : ''}`}
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
                                        >
                                            <div className="track-number">
                                                {isActive ? <Pause size={14} className="active-icon" /> :
                                                    isCurrent ? <Play size={14} className="active-icon" /> :
                                                        <>
                                                            <span className="number-text">{String(index + 1).padStart(2, '0')}</span>
                                                            {track.preview_url && <Play size={14} className="play-icon" />}
                                                        </>}
                                            </div>
                                            <div className="track-info">
                                                <div className="track-name">
                                                    {track.name}
                                                    {isActive && (
                                                        <span className="eq-bars">
                                                            <motion.span animate={{ height: [3, 14, 3] }} transition={{ repeat: Infinity, duration: 0.45, delay: 0 }} />
                                                            <motion.span animate={{ height: [8, 3, 8] }} transition={{ repeat: Infinity, duration: 0.45, delay: 0.15 }} />
                                                            <motion.span animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 0.45, delay: 0.3 }} />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="track-artists">
                                                    {track.artists?.map((art, idx) => (
                                                        <span key={art.id}>
                                                            <Link
                                                                href={`/artists/${art.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="track-artist-link"
                                                            >
                                                                {art.name}
                                                            </Link>
                                                            {idx < track.artists.length - 1 && <span>, </span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="track-end">
                                                {track.duration_ms > 0 && (
                                                    <span className="track-duration">
                                                        {formatDuration(track.duration_ms)}
                                                    </span>
                                                )}
                                                {track.is_version && (
                                                    <span className="version-badge">VERSION</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    </div>

                    <style jsx>{`
                .release-hero {
                    position: relative;
                    z-index: 3;
                    padding: 130px 0 80px;
                }
                .hero-backdrop {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 120vh;
                    background-size: cover;
                    background-position: center;
                    filter: blur(120px) saturate(1.8) brightness(0.6);
                    opacity: 0.45;
                    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%);
                    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%);
                    z-index: 1;
                    pointer-events: none;
                    transform: scale(1.2);
                }
                .hero-backdrop-gradient {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 120vh;
                    background: linear-gradient(to bottom, transparent 0%, rgba(5,5,7,0.4) 50%, rgba(5,5,7,0.9) 100%);
                    z-index: 2;
                    pointer-events: none;
                }
                .hero-inner {
                    position: relative;
                    z-index: 3;
                    max-width: 1240px;
                    margin: 0 auto;
                    padding: 40px 5vw 0;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 3px;
                    margin-bottom: 28px;
                    padding: 10px 20px 10px 16px;
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 100px;
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }
                .back-link:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.25);
                    transform: translateX(-4px);
                }
                .hero-grid {
                    display: grid;
                    grid-template-columns: minmax(300px, 420px) 1fr;
                    gap: 64px;
                    align-items: start;
                }
                .cover-wrap {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: 6px;
                    overflow: visible;
                    position: relative;
                }
                .cover-wrap > :first-child {
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow:
                        0 40px 80px rgba(0,0,0,0.5),
                        0 10px 30px rgba(0,0,0,0.4),
                        0 0 0 1px rgba(255,255,255,0.06);
                }
                .cover-glare {
                    position: absolute;
                    inset: 0;
                    border-radius: 6px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
                    pointer-events: none;
                    z-index: 2;
                }
                .cover-reflection {
                    position: absolute;
                    bottom: -30%;
                    left: 5%; right: 5%;
                    height: 30%;
                    overflow: hidden;
                    border-radius: 0 0 6px 6px;
                    opacity: 0.08;
                    filter: blur(6px);
                    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
                    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
                    pointer-events: none;
                }
                .meta-card {
                    padding-top: 12px;
                }
                .meta-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 10px;
                    letter-spacing: 4px;
                    color: rgba(255,255,255,0.5);
                    font-weight: 900;
                    margin-bottom: 20px;
                }
                .kicker-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.4);
                }
                .release-title {
                    font-size: clamp(32px, 5vw, 72px);
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    line-height: 0.95;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                    color: #fff;
                    text-wrap: balance;
                }
                .artist-list {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 28px;
                }
                .artist-pill a {
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-size: 17px;
                    font-weight: 600;
                    transition: color 0.2s ease;
                }
                .artist-pill a:hover {
                    color: #fff;
                }
                .artist-sep {
                    color: rgba(255,255,255,0.2);
                    margin: 0 2px;
                    font-weight: 400;
                }
                .stat-row {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }
                .stat-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 100px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                }
                .action-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-top: 8px;
                }
                .primary-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .primary-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255,255,255,0.15);
                }
                .secondary-btn {
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.12);
                    padding: 14px 28px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    background: rgba(255,255,255,0.02);
                    transition: all 0.25s ease;
                }
                .secondary-btn:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    border-color: rgba(255,255,255,0.2);
                }
                .tracklist-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 0 16px 16px;
                }
                .tracklist-kicker {
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    color: rgba(255,255,255,0.5);
                }
                .tracklist-count {
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                }
                .tracklist-panel {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 16px;
                    padding: 8px 0;
                    backdrop-filter: blur(20px);
                }
                .track-row {
                    display: grid;
                    grid-template-columns: 52px 1fr 100px;
                    align-items: center;
                    padding: 16px 20px;
                    margin: 0 8px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .track-row.playable {
                    cursor: pointer;
                }
                .track-row:hover {
                    background: rgba(255,255,255,0.03);
                }
                .track-row.active {
                    background: rgba(255,255,255,0.05);
                }
                .track-row:hover .track-name {
                    color: #fff;
                }
                .track-row.active .track-name {
                    color: #fff;
                }
                .track-number {
                    position: relative;
                    font-size: 12px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                }
                .number-text {
                    transition: opacity 0.2s ease;
                }
                .play-icon {
                    position: absolute;
                    opacity: 0;
                    color: #fff;
                    transition: opacity 0.2s ease;
                }
                .active-icon {
                    color: #fff;
                }
                .track-row.playable:hover .number-text {
                    opacity: 0;
                }
                .track-row.playable:hover .play-icon {
                    opacity: 1;
                }
                .track-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .track-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.75);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: color 0.2s ease;
                }
                .eq-bars {
                    display: inline-flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 14px;
                    margin-left: 4px;
                }
                .eq-bars span {
                    width: 2px;
                    background: #fff;
                    border-radius: 1px;
                }
                .track-artists {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.35);
                }
                .track-artist-link {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }
                .track-artist-link:hover {
                    color: rgba(255,255,255,0.7);
                }
                .track-end {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .track-duration {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                    font-variant-numeric: tabular-nums;
                }
                .version-badge {
                    font-size: 9px;
                    color: rgba(255,255,255,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                @media (max-width: 980px) {
                    .hero-grid {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 40px;
                    }
                    .meta-card {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .cover-wrap {
                        max-width: 360px;
                        margin: 0 auto;
                    }
                    .cover-reflection { display: none; }
                    .stat-row { justify-content: center; }
                    .action-row { justify-content: center; }
                }
                @media (max-width: 600px) {
                    .track-row {
                        grid-template-columns: 36px 1fr 60px;
                        padding: 14px 14px;
                    }
                    .action-row {
                        flex-direction: column;
                        width: 100%;
                    }
                    .primary-btn, .secondary-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
                </div>
            )}
        </>
    );
}
