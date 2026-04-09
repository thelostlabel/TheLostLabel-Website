"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, ExternalLink } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import NextImage from 'next/image';

function getSpotifyEmbedUrl(spotifyUrl: string): string | null {
    if (!spotifyUrl) return null;
    const match = spotifyUrl.match(/track[/:]([A-Za-z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
}

function formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function Player() {
    const { currentTrack, isPlaying, togglePlay, closePlayer, progress, duration, seek } = usePlayer();
    const [embedExpanded, setEmbedExpanded] = useState(false);
    const seekBarRef = useRef<HTMLDivElement>(null);

    if (!currentTrack) return null;

    const isSpotifyMode = !currentTrack.previewUrl && currentTrack.spotifyUrl;
    const embedUrl = isSpotifyMode ? getSpotifyEmbedUrl(currentTrack.spotifyUrl!) : null;
    const progressPct = duration ? (progress / duration) * 100 : 0;

    const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        seek(((e.clientX - rect.left) / rect.width) * duration);
    };

    return (
        <AnimatePresence>
            {currentTrack && (
                <motion.div
                    initial={{ y: 60, opacity: 0, scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 60, opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed bottom-6 left-0 right-0 mx-auto z-[10000] select-none"
                    style={{ width: 'min(94vw, 420px)' }}
                >
                    {/* Ambient glow from album art */}
                    <div
                        className="absolute -inset-6 -z-10 rounded-3xl opacity-30 blur-3xl pointer-events-none"
                        style={{
                            backgroundImage: `url(${currentTrack.image || ''})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    <div
                        className="rounded-[20px] overflow-hidden"
                        style={{
                            background: 'rgba(10,10,12,0.92)',
                            backdropFilter: 'blur(50px) saturate(1.6)',
                            WebkitBackdropFilter: 'blur(50px) saturate(1.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            boxShadow: '0 24px 72px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
                        }}
                    >
                        {/* Spotify embed */}
                        <AnimatePresence>
                            {isSpotifyMode && embedExpanded && embedUrl && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 152, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <iframe
                                        src={embedUrl}
                                        width="100%"
                                        height="152"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        style={{ display: 'block' }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Top section: artwork + info */}
                        <div className="flex items-center gap-3.5 p-3.5 pb-2">
                            {/* Artwork */}
                            <div
                                className="shrink-0 rounded-xl overflow-hidden relative"
                                style={{
                                    width: 52, height: 52,
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                                }}
                            >
                                <NextImage
                                    src={currentTrack.image || '/placeholder.png'}
                                    alt={currentTrack.name}
                                    width={52}
                                    height={52}
                                    className="w-full h-full object-cover"
                                />
                                {/* Now playing indicator on artwork */}
                                {isPlaying && !isSpotifyMode && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <div className="flex items-end gap-[2px] h-3.5">
                                            {[0, 1, 2].map(i => (
                                                <div
                                                    key={i}
                                                    className="w-[2px] rounded-full bg-white/90"
                                                    style={{
                                                        animation: `player-eq 0.75s ease-in-out ${i * 0.12}s infinite alternate`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-semibold text-white/90 leading-tight tracking-tight">
                                    {currentTrack.name}
                                </div>
                                <div className="truncate text-[10px] text-white/30 mt-0.5 tracking-wide">
                                    {currentTrack.artist || 'Unknown Artist'}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {isSpotifyMode ? (
                                    <>
                                        <button
                                            onClick={() => setEmbedExpanded(v => !v)}
                                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                                            style={{
                                                background: embedExpanded ? '#1DB954' : 'rgba(255,255,255,0.06)',
                                                border: embedExpanded ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                            }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill={embedExpanded ? '#000' : '#1DB954'}>
                                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                            </svg>
                                        </button>
                                        <a
                                            href={currentTrack.spotifyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            <ExternalLink size={13} color="rgba(255,255,255,0.4)" />
                                        </a>
                                    </>
                                ) : (
                                    <button
                                        onClick={togglePlay}
                                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150"
                                        style={{ boxShadow: '0 4px 16px rgba(255,255,255,0.1)' }}
                                    >
                                        {isPlaying
                                            ? <Pause size={15} fill="#000" color="#000" />
                                            : <Play size={15} fill="#000" color="#000" className="ml-[2px]" />
                                        }
                                    </button>
                                )}

                                <button
                                    onClick={closePlayer}
                                    className="w-7 h-7 rounded-full flex items-center justify-center opacity-25 hover:opacity-60 transition-opacity duration-150"
                                >
                                    <X size={12} color="#fff" />
                                </button>
                            </div>
                        </div>

                        {/* Seek bar — full width, cinematic style */}
                        {!isSpotifyMode && (
                            <div className="px-3.5 pb-3.5 pt-1">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[9px] text-white/20 tabular-nums font-medium w-7 text-right shrink-0">
                                        {formatTime(progress)}
                                    </span>

                                    <div
                                        ref={seekBarRef}
                                        onClick={handleSeekClick}
                                        className="relative flex-1 h-5 flex items-center cursor-pointer group"
                                    >
                                        {/* Track */}
                                        <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/[0.08] group-hover:h-[4px] transition-all duration-200 overflow-hidden">
                                            {/* Progress */}
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-full transition-colors duration-200"
                                                style={{
                                                    width: `${progressPct}%`,
                                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.55))',
                                                }}
                                            />
                                        </div>
                                        {/* Thumb */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full bg-white scale-0 group-hover:scale-100 transition-transform duration-150"
                                            style={{
                                                left: `calc(${progressPct}% - 5.5px)`,
                                                boxShadow: '0 0 8px rgba(255,255,255,0.25)',
                                            }}
                                        />
                                    </div>

                                    <span className="text-[9px] text-white/12 tabular-nums font-medium w-7 shrink-0">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <style>{`
                        @keyframes player-eq {
                            0% { height: 3px; }
                            100% { height: 12px; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
