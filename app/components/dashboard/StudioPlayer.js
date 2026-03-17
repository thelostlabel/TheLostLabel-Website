"use client";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat } from 'lucide-react';

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function StudioPlayer(props) {
    return <StudioPlayerInner key={props.src || 'empty-track'} {...props} />;
}

function StudioPlayerInner({ src, filename }) {
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const animationRef = useRef(null);
    const blobUrlRef = useRef(null);

    const [blobSrc, setBlobSrc] = useState(null);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState(null);

    // Load audio directly for streaming - no need to download entire file
    useEffect(() => {
        if (!src) return;
        setLoadingAudio(true);
        setLoadProgress(0);
        setError(null);
        
        // Clean up previous blob URL
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
        setBlobSrc(null);
        
        return () => {
            // Cleanup on unmount
        };
    }, [src]);

    // Update blobSrc to use direct URL for streaming
    useEffect(() => {
        if (src && !blobSrc) {
            setBlobSrc(src);
        }
    }, [src]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = volume;
        audioRef.current.loop = isLoop;
        audioRef.current.muted = isMuted;
    }, [isLoop, isMuted, volume]);

    useEffect(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    useEffect(() => {
        const updateProgress = () => {
            if (audioRef.current && !isDragging) {
                setCurrentTime(audioRef.current.currentTime);
            }
            animationRef.current = requestAnimationFrame(updateProgress);
        };

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateProgress);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isDragging, isPlaying]);

    // Audio event handlers
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        if (!isLoop) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = (e) => {
        console.error("Audio error:", e);
        setError("Unable to load audio file. Please check your connection and try again.");
        setIsPlaying(false);
        setIsBuffering(false);
    };

    // Retry - just reload the audio element
    const retryLoad = () => {
        setError(null);
        if (audioRef.current) {
            audioRef.current.load();
        }
        setLoadingAudio(true);
        setLoadProgress(0);
        setTimeout(() => setLoadingAudio(false), 1000);
    };

    // Playback controls
    const togglePlay = async () => {
        if (!audioRef.current || loadingAudio) return;
        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error("Play/pause error:", err);
            setError("Unable to play audio. Please try again.");
        }
    };

    const skipForward = () => {
        if (audioRef.current && duration > 0) {
            const newTime = Math.min(audioRef.current.currentTime + 10, duration);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const skipBackward = () => {
        if (audioRef.current && duration > 0) {
            const newTime = Math.max(audioRef.current.currentTime - 10, 0);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleLoop = () => {
        if (audioRef.current) {
            audioRef.current.loop = !isLoop;
            setIsLoop(!isLoop);
        }
    };

    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (audioRef.current) {
            audioRef.current.volume = newVol;
        }
        if (newVol === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
            audioRef.current.muted = false;
        }
    };

    // Progress bar seeking
    const calculateSeekPosition = (e) => {
        const bar = progressRef.current;
        if (!bar) return 0;
        const rect = bar.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        return (x / rect.width) * duration;
    };

    const handleProgressMouseDown = (e) => {
        setIsDragging(true);
        const seekTime = calculateSeekPosition(e);
        setCurrentTime(seekTime);

        const handleMouseMove = (ev) => {
            const t = calculateSeekPosition(ev);
            setCurrentTime(t);
        };

        const handleMouseUp = (ev) => {
            const t = calculateSeekPosition(ev);
            if (audioRef.current) {
                audioRef.current.currentTime = t;
            }
            setCurrentTime(t);
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Touch support
    const handleProgressTouchStart = (e) => {
        setIsDragging(true);
        const touch = e.touches[0];
        const bar = progressRef.current;
        if (!bar) return;
        const rect = bar.getBoundingClientRect();
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
        const seekTime = (x / rect.width) * duration;
        setCurrentTime(seekTime);

        const handleTouchMove = (ev) => {
            const t2 = ev.touches[0];
            const x2 = Math.max(0, Math.min(t2.clientX - rect.left, rect.width));
            setCurrentTime((x2 / rect.width) * duration);
        };

        const handleTouchEnd = (ev) => {
            const ct = ev.changedTouches[0];
            const x2 = Math.max(0, Math.min(ct.clientX - rect.left, rect.width));
            const t = (x2 / rect.width) * duration;
            if (audioRef.current) {
                audioRef.current.currentTime = t;
            }
            setCurrentTime(t);
            setIsDragging(false);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="studio-player">
            {/* Hidden audio element — uses blob URL for instant seeking */}
            {blobSrc && (
                <audio
                    ref={audioRef}
                    src={blobSrc}
                    preload="auto"
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    onWaiting={handleWaiting}
                    onCanPlay={handleCanPlay}
                    onError={handleError}
                    onPlay={handlePlay}
                    onPause={handlePause}
                />
            )}

            {/* Now Playing Label */}
            <div className="sp-now-playing">
                <div className="sp-visualizer">
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className={`sp-bar ${isPlaying ? 'active' : ''}`} style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                </div>
                <span className="sp-track-label">
                    {filename?.toUpperCase() || 'UNKNOWN TRACK'}
                </span>
                {loadingAudio && (
                    <span className="sp-buffering">
                        LOADING{loadProgress > 0 ? ` ${loadProgress}%` : '...'}
                    </span>
                )}
                {!loadingAudio && isBuffering && <span className="sp-buffering">BUFFERING...</span>}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="sp-error" style={{ color: '#ef4444', fontSize: '9px', fontWeight: 700, letterSpacing: '1px' }}>{error}</span>
                        <button
                            onClick={retryLoad}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '8px',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            RETRY
                        </button>
                    </div>
                )}
            </div>

            {/* Loading progress bar */}
            {loadingAudio && (
                <div className="sp-load-bar">
                    <div className="sp-load-fill" style={{ width: `${loadProgress}%` }} />
                </div>
            )}

            {/* Progress Bar */}
            <div className="sp-progress-wrapper">
                <span className="sp-time">{formatTime(currentTime)}</span>
                <div
                    ref={progressRef}
                    className="sp-progress-bar"
                    onMouseDown={handleProgressMouseDown}
                    onTouchStart={handleProgressTouchStart}
                >
                    <div className="sp-progress-bg" />
                    <div className="sp-progress-fill" style={{ width: `${progress}%` }} />
                    <div
                        className="sp-progress-thumb"
                        style={{ left: `${progress}%` }}
                    />
                </div>
                <span className="sp-time">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="sp-controls">
                <div className="sp-controls-left">
                    <button onClick={toggleLoop} className={`sp-icon-btn ${isLoop ? 'sp-active' : ''}`} title="Loop">
                        <Repeat size={15} />
                    </button>
                </div>

                <div className="sp-controls-center">
                    <button onClick={skipBackward} className="sp-icon-btn" title="Back 10s">
                        <SkipBack size={17} />
                    </button>
                    <button onClick={togglePlay} className="sp-play-btn" title={isPlaying ? 'Pause' : 'Play'} style={{ opacity: loadingAudio ? 0.4 : 1 }}>
                        {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
                    </button>
                    <button onClick={skipForward} className="sp-icon-btn" title="Forward 10s">
                        <SkipForward size={17} />
                    </button>
                </div>

                <div className="sp-controls-right">
                    <button onClick={toggleMute} className="sp-icon-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <span className="sp-volume-label">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="sp-volume-slider"
                    />
                </div>
            </div>

            <style jsx>{`
                .studio-player {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                }
                .studio-player::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                }

                /* Now Playing */
                .sp-now-playing {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .sp-visualizer {
                    display: flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 16px;
                }
                .sp-bar {
                    width: 3px;
                    height: 4px;
                    background: #4a4a4a;
                    border-radius: 1px;
                    transition: background 0.3s;
                }
                .sp-bar.active {
                    background: #d1d5db;
                    animation: sp-bounce 0.8s ease-in-out infinite alternate;
                }
                @keyframes sp-bounce {
                    0% { height: 4px; }
                    100% { height: 16px; }
                }
                .sp-track-label {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.6px;
                    color: #fff;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .sp-buffering {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: #f59e0b;
                    animation: sp-pulse 1s ease infinite;
                }
                @keyframes sp-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                /* Load progress */
                .sp-load-bar {
                    height: 3px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 2px;
                    margin-bottom: 16px;
                    overflow: hidden;
                }
                .sp-load-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #6b7280, #d1d5db);
                    border-radius: 2px;
                    transition: width 0.2s ease;
                }

                /* Progress */
                .sp-progress-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .sp-time {
                    font-size: 11px;
                    font-weight: 600;
                    color: #555;
                    font-variant-numeric: tabular-nums;
                    min-width: 36px;
                    user-select: none;
                }
                .sp-progress-bar {
                    flex: 1;
                    height: 6px;
                    position: relative;
                    cursor: pointer;
                    border-radius: 3px;
                    padding: 12px 0;
                    margin: -12px 0;
                    touch-action: none;
                }
                .sp-progress-bg {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 4px;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.06);
                    border-radius: 2px;
                    pointer-events: none;
                }
                .sp-progress-fill {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    height: 4px;
                    transform: translateY(-50%);
                    background: linear-gradient(90deg, #9ca3af, #d1d5db);
                    border-radius: 2px;
                    transition: width 0.05s linear;
                    pointer-events: none;
                }
                .sp-progress-thumb {
                    position: absolute;
                    top: 50%;
                    width: 14px;
                    height: 14px;
                    background: #fff;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
                    opacity: 0.7;
                    transition: opacity 0.2s, transform 0.15s;
                    pointer-events: none;
                }
                .sp-progress-bar:hover .sp-progress-thumb,
                .sp-progress-bar:active .sp-progress-thumb {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.15);
                }
                .sp-progress-bar:hover .sp-progress-fill {
                    background: linear-gradient(90deg, #d1d5db, #fff);
                    height: 5px;
                }
                .sp-progress-bar:hover .sp-progress-bg {
                    background: rgba(255,255,255,0.1);
                    height: 5px;
                }

                /* Controls */
                .sp-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .sp-controls-left,
                .sp-controls-right {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 90px;
                }
                .sp-controls-right {
                    justify-content: flex-end;
                }
                .sp-controls-center {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sp-icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: #777;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    transition: all 0.2s;
                }
                .sp-icon-btn:hover {
                    background: rgba(255,255,255,0.06);
                    color: #ddd;
                }
                .sp-icon-btn.sp-active {
                    color: #d1d5db;
                    background: rgba(209,213,219,0.1);
                }
                .sp-play-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    background: #fff;
                    color: #000;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    transition: all 0.2s;
                    box-shadow: 0 4px 20px rgba(255,255,255,0.1);
                }
                .sp-play-btn:hover {
                    transform: scale(1.06);
                    box-shadow: 0 6px 28px rgba(255,255,255,0.15);
                }
                .sp-play-btn:active {
                    transform: scale(0.96);
                }

                /* Volume */
                .sp-volume-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 70px;
                    height: 6px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
                    border-radius: 3px;
                    outline: none;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .sp-volume-slider:hover {
                    background: linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%);
                }
                .sp-volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .sp-volume-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.15);
                }
                .sp-volume-slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .sp-volume-slider::-moz-range-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.15);
                }
                .sp-volume-slider::-moz-range-progress {
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%);
                }
                .sp-volume-label {
                    font-size: 9px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.5);
                    min-width: 28px;
                    text-align: center;
                    letter-spacing: 0.5px;
                }

                @media (max-width: 640px) {
                    .studio-player {
                        padding: 18px;
                    }
                    .sp-controls-left,
                    .sp-controls-right {
                        min-width: auto;
                    }
                    .sp-volume-slider {
                        display: none;
                    }
                    .sp-play-btn {
                        width: 44px;
                        height: 44px;
                    }
                }
            `}</style>
        </div>
    );
}
