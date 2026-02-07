"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArtistDetailPage() {
    const params = useParams();
    const artistId = params.id;
    const PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

    const [artist, setArtist] = useState(null);
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArtistData() {
            try {
                const artistRes = await fetch(`/api/spotify/artist/${artistId}`);
                const artistData = await artistRes.json();
                if (artistData.artist) setArtist(artistData.artist);

                const playlistRes = await fetch(`/api/spotify/playlist/${PLAYLIST_ID}`);
                const playlistData = await playlistRes.json();

                if (playlistData.releases) {
                    const artistReleases = playlistData.releases.filter(release => {
                        return release.artists?.some(a => a.id === artistId);
                    });

                    const seen = new Map();
                    const uniqueReleases = artistReleases.filter(release => {
                        const normalizedName = release.name
                            .toLowerCase()
                            .replace(/\s*[\(\[].*?[\)\]]\s*/g, '')
                            .replace(/\s*(slowed|sped up|speed up|reverb|bass boosted)\s*/gi, '')
                            .trim();

                        if (seen.has(normalizedName)) return false;
                        seen.set(normalizedName, true);
                        return true;
                    });
                    setReleases(uniqueReleases);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (artistId) fetchArtistData();
    }, [artistId]);

    const glassStyle = {
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '20px',
        overflow: 'hidden'
    };

    if (loading) {
        return (
            <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.p
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#444' }}
                >
                    INITIALIZING_DATA_STREAM
                </motion.p>
            </div>
        );
    }

    if (!artist) {
        return (
            <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5vw' }}>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: '900', letterSpacing: '-0.04em' }}>ARTIST_NOT_FOUND</h1>
                <Link href="/artists" style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '30px', fontWeight: '900', letterSpacing: '2px', textDecoration: 'none' }}>
                    ← RETURN_TO_ROSTER
                </Link>
            </div>
        );
    }

    return (
        <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingTop: '120px' }}>
            {/* Design Layers */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.04, filter: 'url(#noiseFilter)' }} />

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)', filter: 'blur(120px)' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '0 5vw 100px' }}>
                {/* Artist Header */}
                <header style={{ marginBottom: '100px' }}>
                    <div style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                width: '280px',
                                height: '280px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <img
                                src={artist.images?.[0]?.url || '/placeholder.png'}
                                alt={artist.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{ flex: 1, minWidth: '300px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
                                <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', fontWeight: '900' }}>BRAND_ARTIST</span>
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(42px, 8vw, 100px)',
                                fontWeight: '900',
                                letterSpacing: '-0.04em',
                                lineHeight: '0.9',
                                textTransform: 'uppercase',
                                marginBottom: '25px'
                            }}>
                                {artist.name}
                            </h1>
                            <div style={{ display: 'flex', gap: '40px', fontSize: '13px', color: '#888', flexWrap: 'wrap', fontWeight: '800', letterSpacing: '1px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '9px', color: '#444' }}>FOLLOWERS</span>
                                    <span style={{ color: '#fff' }}>{artist.followers?.total?.toLocaleString() || 0}</span>
                                </div>
                                {artist.monthlyListeners && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <span style={{ fontSize: '9px', color: '#444' }}>MONTHLY_LISTENERS</span>
                                        <span style={{ color: 'var(--accent)' }}>{artist.monthlyListeners.toLocaleString()}</span>
                                    </div>
                                )}
                                {artist.genres?.[0] && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <span style={{ fontSize: '9px', color: '#444' }}>CORE_GENRE</span>
                                        <span style={{ color: '#fff', textTransform: 'uppercase' }}>{artist.genres[0]}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                                <a
                                    href={artist.external_urls?.spotify}
                                    target="_blank"
                                    className="glow-button"
                                    style={{ padding: '16px 40px', fontSize: '11px', textDecoration: 'none' }}
                                >
                                    OPEN_SPOTIFY_PROFILE
                                </a>
                                <Link
                                    href="/artists"
                                    style={{
                                        padding: '16px 30px',
                                        fontSize: '11px',
                                        color: '#666',
                                        fontWeight: '900',
                                        letterSpacing: '2px',
                                        textDecoration: 'none',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '30px'
                                    }}
                                >
                                    BACK_TO_ROSTER
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </header>

                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '12px', letterSpacing: '5px', fontWeight: '900', color: '#444' }}>
                            PROJECTS <span style={{ color: 'var(--accent)' }}>({releases.length})</span>
                        </h2>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    </div>

                    {releases.length === 0 ? (
                        <div style={{ ...glassStyle, padding: '100px', textAlign: 'center' }}>
                            <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>DATA_ABSENT: NO RELEASES FOUND IN CATALOG</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
                            {releases.map((release, i) => (
                                <motion.div
                                    key={release.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.05), duration: 0.4 }}
                                    whileHover={{ y: -10, transition: { duration: 0.15, delay: 0 } }}
                                >
                                    <a
                                        href={release.spotify_url}
                                        target="_blank"
                                        style={{
                                            ...glassStyle,
                                            padding: '15px',
                                            display: 'block',
                                            textDecoration: 'none',
                                            transition: 'border-color 0.3s'
                                        }}
                                        className="release-card-hover"
                                    >
                                        <div style={{
                                            aspectRatio: '1',
                                            marginBottom: '20px',
                                            overflow: 'hidden',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px'
                                        }}>
                                            {(() => {
                                                const coverSrc = release.image?.startsWith('private/') ? `/api/files/release/${release.id}` : (release.image || '/placeholder.png');
                                                return (
                                                    <img
                                                        src={coverSrc}
                                                        alt={release.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {release.name}
                                        </h3>
                                        <p style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>
                                            {new Date(release.release_date).getFullYear()}
                                        </p>
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    );
}
