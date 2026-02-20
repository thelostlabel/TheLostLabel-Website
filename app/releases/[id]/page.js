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
                <Link href="/releases" style={{ color: 'var(--accent)', marginTop: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>
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

            {release && (
                <div style={{ background: 'transparent', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '0px' }}>
                    <BackgroundEffects />

                    <div
                        className="hero-backdrop"
                        style={normalizedImage ? { backgroundImage: `url(${normalizedImage})` } : undefined}
                    />
                    <div className="hero-backdrop-gradient" />

                    <section className="release-hero">
                        <div className="hero-inner">
                            <Link href="/releases" className="back-link">
                                <ChevronLeft size={16} strokeWidth={3} /> RETURN TO CATALOG
                            </Link>

                            <div className="hero-grid">
                                <motion.div
                                    initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
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
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                    transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="meta-card"
                                >
                                    <div className="meta-kicker">
                                        <span className="kicker-line" />
                                        <span>{release?.type?.toUpperCase() || 'RELEASE DATA'}</span>
                                    </div>
                                    <h1 className="release-title">{release.name}</h1>

                                    <div className="artist-list">
                                        <span className="artist-by">BY</span>
                                        {release.artists?.map((art, idx) => (
                                            <span key={art.id} className="artist-pill">
                                                <Link href={`/artists/${art.id}`}>{art.name}</Link>
                                                {idx < release.artists.length - 1 && <span className="artist-sep">,</span>}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="stat-row">
                                        <div className="stat-item">
                                            <div className="stat-label">RELEASED</div>
                                            <div className="stat-value">{releaseDateLabel}</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">TRACKS</div>
                                            <div className="stat-value">{release.total_tracks}</div>
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
                                                <div className="play-icon-wrap"><Play size={12} fill="#000" /></div>
                                                PLAY PREVIEW
                                            </button>
                                        )}
                                        <a href={release.spotify_url} target="_blank" className="secondary-btn">
                                            <ExternalLink size={14} /> SPOTIFY
                                        </a>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '40px 5vw 100px' }}>
                        <motion.section
                            initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                                        <div
                                            key={track.id}
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
                                                        <motion.div
                                                            animate={{ height: [4, 12, 4] }}
                                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                                            style={{ width: '2px', background: 'var(--accent)', marginLeft: '8px' }}
                                                        />
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
                    padding: 150px 0 60px;
                }
                .hero-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 140vh;
                    background-size: cover;
                    background-position: center;
                    filter: blur(140px) saturate(2) brightness(0.8);
                    opacity: 0.35;
                    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
                    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
                    z-index: 1;
                    pointer-events: none;
                    transform: scale(1.1);
                }
                .hero-backdrop-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 140vh;
                    background: linear-gradient(to bottom, transparent 0%, rgba(6,7,10,0.5) 60%, rgba(6,7,10,0.8) 100%);
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
                    gap: 6px;
                    color: rgba(255,255,255,0.4);
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                    padding: 12px 0;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .back-link:hover {
                    color: #fff;
                    transform: translateX(-4px);
                }
                .hero-grid {
                    display: grid;
                    grid-template-columns: minmax(320px, 400px) 1fr;
                    gap: 60px;
                    align-items: center;
                    padding-top: 10px;
                }
                .cover-wrap {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.6), 
                                0 0 0 1px rgba(255,255,255,0.08);
                    position: relative;
                    transform-origin: center bottom;
                }
                .meta-card {
                    background: transparent;
                    border: none;
                    padding: 0;
                }
                .meta-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 10px;
                    letter-spacing: 4px;
                    color: var(--accent);
                    font-weight: 900;
                    margin-bottom: 24px;
                }
                .kicker-line {
                    width: 30px;
                    height: 1px;
                    background: var(--accent);
                }
                .release-title {
                    font-size: clamp(36px, 5.5vw, 84px);
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    line-height: 0.95;
                    text-transform: uppercase;
                    margin-bottom: 24px;
                    color: #fff;
                    text-wrap: balance;
                    text-shadow: 0 4px 30px rgba(0,0,0,0.4);
                }
                .artist-list {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 32px;
                }
                .artist-by {
                    font-size: 13px;
                    color: rgba(255,255,255,0.4);
                    font-weight: 700;
                    margin-right: 4px;
                }
                .artist-pill a {
                    color: #fff;
                    text-decoration: none;
                    font-size: 18px;
                    font-weight: 700;
                    letter-spacing: 0px;
                    transition: opacity 0.2s ease;
                }
                .artist-pill a:hover {
                    color: var(--accent);
                }
                .artist-sep {
                    color: rgba(255,255,255,0.3);
                }
                .stat-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                    max-width: 320px;
                }
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .stat-label {
                    font-size: 10px;
                    color: rgba(255,255,255,0.4);
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .stat-value {
                    font-size: 14px;
                    font-weight: 800;
                    color: #fff;
                }
                .action-row {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-top: 10px;
                }
                .primary-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }
                .primary-btn:hover {
                    background: #e6e6e6;
                    transform: translateY(-2px);
                }
                .secondary-btn {
                    background: transparent;
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .secondary-btn:hover {
                    background: rgba(255,255,255,1);
                    color: #000;
                }
                .tracklist-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    padding: 0 0 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .tracklist-kicker {
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    color: #fff;
                }
                .tracklist-count {
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.4);
                }
                .tracklist-panel {
                    background: transparent;
                    width: 100%;
                }
                .track-row {
                    display: grid;
                    grid-template-columns: 50px 1fr 100px;
                    align-items: center;
                    padding: 20px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.2s ease;
                }
                .track-row.playable {
                    cursor: pointer;
                }
                .track-row:hover .track-name {
                    color: #fff;
                }
                .track-row.active .track-name {
                    color: var(--accent);
                }
                .track-number {
                    position: relative;
                    font-size: 11px;
                    font-weight: 900;
                    color: rgba(255,255,255,0.3);
                    display: flex;
                    align-items: center;
                }
                .number-text {
                    transition: opacity 0.2s ease;
                }
                .play-icon {
                    position: absolute;
                    left: 0;
                    opacity: 0;
                    color: #fff;
                    transition: opacity 0.2s ease;
                }
                .active-icon {
                    color: var(--accent);
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
                    gap: 6px;
                }
                .track-name {
                    font-size: 15px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    transition: color 0.2s ease;
                }
                .track-artists {
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.4);
                }
                .track-artist-link {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }
                .track-artist-link:hover {
                    color: #fff;
                }
                .track-end {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .track-duration {
                    font-size: 12px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.5);
                }
                .version-badge {
                    font-size: 9px;
                    color: var(--accent);
                    border: 1px solid var(--accent);
                    padding: 4px 8px;
                    border-radius: 0;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                @media (max-width: 980px) {
                    .hero-grid {
                        grid-template-columns: 1fr;
                        align-items: center;
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
                    .stat-row {
                        justify-content: center;
                    }
                    .action-row {
                        justify-content: center;
                    }
                }
                @media (max-width: 600px) {
                    .stat-row {
                        flex-direction: column;
                        gap: 20px;
                    }
                    .track-row {
                        grid-template-columns: 30px 1fr 60px;
                    }
                }
            `}</style>
                </div>
            )}
        </>
    );
}
