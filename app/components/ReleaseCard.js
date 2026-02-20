"use client";
import Link from 'next/link';
import NextImage from 'next/image';
import { Play, Pause, ExternalLink } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

export default function ReleaseCard({ id, fallbackTitle, fallbackArtist, initialData }) {
    const data = initialData || null;
    const loading = !initialData;
    const error = false;
    const { playTrack, currentTrack, isPlaying } = usePlayer();

    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const getBaseTitle = (t) => {
        if (!t) return "";
        return t.split(' (')[0].split(' - ')[0].trim();
    };

    const artist = data?.artists?.map(a => a.name).join(", ") || data?.artist || fallbackArtist;
    const title = data?.name || fallbackTitle;
    const baseTitle = getBaseTitle(title);
    const image = data?.image;

    const normalizedImage = image
        ? (image.startsWith('private/') && (initialData?.id || id)
            ? `/api/files/release/${initialData?.id || id}`
            : image)
        : null;

    const hasPreview = Boolean(data?.preview_url);
    const versionCount = initialData?.versionCount || 0;
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
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="release-card" style={{
                padding: '0',
                borderRadius: '0', // Kurate style square edges
                border: 'none',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '1/1',
                boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.3)',
                background: '#111'
            }}>
            {/* Removed Hover Spotlight */}

            <Link href={`/releases/${data?.id || id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <div className="card-image-container" style={{
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {normalizedImage ? (
                        <>
                            <motion.div
                                animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <NextImage
                                    src={normalizedImage}
                                    alt={title}
                                    width={400}
                                    height={400}
                                    className="release-image"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </motion.div>
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

                            {versionCount > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '6px 12px',
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    letterSpacing: '1px',
                                    borderRadius: '0px',
                                    border: '1px solid rgba(255,255,255,1)',
                                    zIndex: 2
                                }}>
                                    {versionCount} VERSIONS
                                </div>
                            )}

                            {/* Play Button Overlay - only if preview exists */}
                            {hasPreview && (
                                <div className={`play-overlay ${isActive ? 'active' : ''}`} onClick={handlePlay}>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '0px',
                                            background: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        }}>
                                        {isActive ? <Pause size={28} fill="#000" /> : <Play size={28} fill="#000" style={{ marginLeft: '4px' }} />}
                                    </motion.div>
                                </div>
                            )}

                            {/* Gradient Overlay and Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                                transition={{ duration: 0.4 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0, left: 0, right: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                                    padding: '40px 24px 24px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    zIndex: 6
                                }}
                            >
                                <h3 style={{
                                    fontSize: '24px',
                                    color: '#fff',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>{baseTitle.toUpperCase()}</h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontWeight: '500',
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>{artist}</p>
                            </motion.div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <span style={{ fontSize: '10px', color: '#1a1a1a', fontWeight: '800', letterSpacing: '5px' }}>
                                {loading ? 'SYNCING...' : error ? 'CONFIG_ERROR' : 'ARCHIVE'}
                            </span>
                        </div>
                    )}
                </div>
            </Link>
            <style jsx>{`
                .release-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.15);
                    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5) !important;
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
                    z-index: 5;
                }
                .release-card:hover .play-overlay, .play-overlay.active {
                    opacity: 1;
                }
            `}</style>
        </motion.div>
    );
}
