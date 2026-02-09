"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, Maximize2, Minimize2, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import NextImage from 'next/image';

export default function Player() {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        closePlayer,
        isExpanded,
        setIsExpanded,
        progress,
        duration,
        seek,
        volume,
        setVolume
    } = usePlayer();

    if (!currentTrack) return null;

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <AnimatePresence>
            {currentTrack && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        x: '-50%',
                        width: '95%',
                        maxWidth: '600px',
                        zIndex: 9999
                    }}
                >
                    <div
                        className="glass-premium"
                        style={{
                            padding: '16px 24px',
                            borderRadius: '24px',
                            background: 'rgba(10, 10, 10, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px'
                        }}
                    >
                        {/* Artwork */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#222'
                            }}>
                                <NextImage
                                    src={currentTrack.image || '/placeholder.png'}
                                    alt={currentTrack.name}
                                    width={48}
                                    height={48}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            {/* Rotating Vinyl Effect overlay if playing */}
                            <motion.div
                                animate={{ rotate: isPlaying ? 360 : 0 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    inset: -2,
                                    borderRadius: '50%',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    opacity: isPlaying ? 0.5 : 0,
                                    pointerEvents: 'none'
                                }}
                            />
                        </div>

                        {/* Track Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentTrack.name}
                                </h4>
                                <span style={{
                                    fontSize: '9px',
                                    background: 'var(--accent)',
                                    color: '#000',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    fontWeight: '900'
                                }}>PREVIEW</span>
                            </div>
                            <p style={{
                                margin: '2px 0 0',
                                fontSize: '11px',
                                color: '#888',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {currentTrack.artist || 'Unknown Artist'}
                            </p>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* <SkipBack size={18} color="#888" style={{ cursor: 'pointer' }} /> */}

                            <button
                                onClick={togglePlay}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                                }}
                            >
                                {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: '2px' }} />}
                            </button>

                            {/* <SkipForward size={18} color="#888" style={{ cursor: 'pointer' }} /> */}
                        </div>

                        {/* Progress Bar (Abs positioned at bottom) */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '24px',
                                right: '24px',
                                height: '2px',
                                background: 'rgba(255,255,255,0.1)',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                seek(percent * duration);
                            }}
                        >
                            <motion.div
                                style={{
                                    height: '100%',
                                    background: 'var(--accent)',
                                    width: `${(progress / (duration || 1)) * 100}%`
                                }}
                            />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closePlayer}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                marginLeft: '8px',
                                opacity: 0.6
                            }}
                        >
                            <X size={16} color="#fff" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
