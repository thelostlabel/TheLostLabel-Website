"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Play, Pause, ExternalLink } from 'lucide-react';
import { usePlayer } from './PlayerContext';

export default function ReleaseCard({ id, fallbackTitle, fallbackArtist, initialData }) {
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(false);
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    useEffect(() => {
        async function fetchData() {
            try {
                let endpoint = `/api/spotify/album/${id}`;

                // Smart detection: Check if it's a Track or Album based on URL
                if (initialData?.spotify_url) {
                    if (initialData.spotify_url.includes('/track/')) {
                        const match = initialData.spotify_url.match(/track\/([a-zA-Z0-9]+)/);
                        if (match?.[1]) endpoint = `/api/spotify/track/${match[1]}`;
                    } else if (initialData.spotify_url.includes('/album/')) {
                        const match = initialData.spotify_url.match(/album\/([a-zA-Z0-9]+)/);
                        if (match?.[1]) endpoint = `/api/spotify/album/${match[1]}`;
                    }
                }



                const res = await fetch(endpoint);
                const json = await res.json();
                if (res.ok && !json.error) {
                    setData(prev => prev ? { ...prev, ...json } : json);
                } else {
                    // console.warn("Spotify enrichment failed", json);
                }
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        }

        if (initialData) {
            setData(initialData);

            // Optimization: If we already have preview_url from DB (new logic), don't fetch!
            if (initialData.previewUrl || initialData.preview_url) {
                setLoading(false);
            } else if (id && !id.startsWith('archive')) {
                // Only fetch if strictly necessary (missing preview and valid spotify ID)
                fetchData();
            } else {
                setLoading(false);
            }
        } else if (id && !id.startsWith('archive')) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [id, initialData]);

    // Fallback: if no preview_url but track URL exists, fetch track preview
    useEffect(() => {
        if (data?.preview_url) return;
        const trackMatch = data?.spotify_url?.match(/track\/([a-zA-Z0-9]+)/);
        if (!trackMatch) return;
        const trackId = trackMatch[1];
        const fetchTrack = async () => {
            try {
                const res = await fetch(`/api/spotify/track/${trackId}`);
                const json = await res.json();
                if (res.ok && !json.error && json.preview_url) {
                    setData(prev => prev ? { ...prev, preview_url: json.preview_url, preview_track_name: json.name, image: prev.image || json.image } : json);
                }
            } catch (_) { /* silent */ }
        };
        fetchTrack();
    }, [data?.preview_url, data?.spotify_url]);

    const artist = data?.artists?.map(a => a.name).join(", ") || data?.artist || fallbackArtist;
    const title = data?.name || fallbackTitle;
    const image = data?.image;

    const normalizedImage = image
        ? (image.startsWith('private/') && (initialData?.id || id)
            ? `/api/files/release/${initialData?.id || id}`
            : image)
        : null;

    const hasPreview = Boolean(data?.preview_url);
    const isCurrentTrack = currentTrack?.id === (data?.id || id);
    const isActive = isCurrentTrack && isPlaying;

    const handlePlay = (e) => {
        e.preventDefault();
        e.stopPropagation();



        if (!hasPreview) {
            if (data?.spotify_url) {
                window.open(data.spotify_url, '_blank', 'noopener');
            }
            return;
        }

        const track = {
            id: data?.id || id,
            name: title,
            artist: artist,
            image: normalizedImage,
            previewUrl: data?.preview_url
        };


        playTrack(track);
    };

    return (
        <div className="glass-premium" style={{
            padding: '0',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            transition: 'all 0.4s ease',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Link href={`/releases/${data?.id || id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="card-image-container" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2))',
                    height: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {normalizedImage ? (
                        <>
                            <NextImage
                                src={normalizedImage}
                                alt={title}
                                width={400}
                                height={400}
                                className="release-image"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />
                            {data?.stream_count_text && (
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'rgba(245, 197, 66, 0.9)',
                                    backdropFilter: 'blur(4px)',
                                    color: '#000',
                                    padding: '6px 10px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    letterSpacing: '1px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    zIndex: 2
                                }}>
                                    {data.stream_count_text} STREAMS
                                </div>
                            )}

                            {/* Play Button Overlay - only if preview exists */}
                            {hasPreview && (
                                <div className={`play-overlay ${isActive ? 'active' : ''}`} onClick={handlePlay}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                        transition: 'transform 0.2s'
                                    }}>
                                        {isActive ? <Pause size={32} fill="#fff" /> : <Play size={32} fill="#fff" style={{ marginLeft: '4px' }} />}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <span style={{ fontSize: '10px', color: '#1a1a1a', fontWeight: '800', letterSpacing: '5px' }}>
                                {loading ? 'SYNCING...' : error ? 'CONFIG_ERROR' : 'ARCHIVE'}
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ padding: '24px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        fontWeight: '800',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '43px' // Fixed height for 2 lines
                    }}>{title}</h3>
                    <p style={{
                        fontSize: '12px',
                        color: 'var(--accent)',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        marginBottom: '20px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>{artist}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: '1px' }}>LOST_CATALOG_ID: {id?.slice(0, 8).toUpperCase()}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {hasPreview ? (
                                <button
                                    onClick={handlePlay}
                                    style={{ border: 'none', background: 'var(--accent)', color: '#000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,197,66,0.3)' }}
                                >
                                    {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                                </button>
                            ) : (
                                <div style={{ width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                    <ExternalLink size={12} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
            <style jsx>{`
                .glass-premium:hover {
                    transform: translateY(-10px);
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.15);
                    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5);
                }
                .glass-premium:hover .release-image {
                    transform: scale(1.08);
                }
                .play-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-premium:hover .play-overlay, .play-overlay.active {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
