"use client";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat } from 'lucide-react';
import styles from './StudioPlayer.module.css';

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getAppliedVolume(sliderValue) {
    const safeValue = clamp(sliderValue, 0, 1);
    return safeValue ** 2;
}

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
    const progressFillRef = useRef(null);
    const progressThumbRef = useRef(null);
    const volumeSliderRef = useRef(null);
    const animationRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = getAppliedVolume(volume);
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
                if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
                    setDuration(audioRef.current.duration);
                }
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

    const handleDurationChange = () => {
        if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
        }
    };

    const syncCurrentTime = () => {
        if (audioRef.current && !isDragging) {
            setCurrentTime(audioRef.current.currentTime);
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

    // Retry - reload audio element (browser handles Range requests)
    const retryLoad = () => {
        setError(null);
        if (audioRef.current) {
            audioRef.current.load();
        }
    };

    // Playback controls
    const togglePlay = async () => {
        if (!audioRef.current) return;
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
            audioRef.current.volume = getAppliedVolume(newVol);
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
        if (!bar || duration <= 0) return 0;
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
        if (!bar || duration <= 0) return;
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

    const progress = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
    const displayedVolume = Math.round((isMuted ? 0 : volume) * 100);

    useEffect(() => {
        if (progressFillRef.current) {
            progressFillRef.current.style.width = `${progress}%`;
        }
        if (progressThumbRef.current) {
            progressThumbRef.current.style.left = `${progress}%`;
        }
    }, [progress]);

    useEffect(() => {
        if (volumeSliderRef.current) {
            volumeSliderRef.current.style.setProperty('--sp-volume', `${displayedVolume}%`);
        }
    }, [displayedVolume]);

    return (
        <div className={styles.studioPlayer}>
            {src && (
                <audio
                    ref={audioRef}
                    src={src}
                    preload="auto"
                    onLoadedMetadata={handleLoadedMetadata}
                    onDurationChange={handleDurationChange}
                    onEnded={handleEnded}
                    onWaiting={handleWaiting}
                    onCanPlay={handleCanPlay}
                    onError={handleError}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onTimeUpdate={syncCurrentTime}
                    onSeeking={syncCurrentTime}
                    onSeeked={syncCurrentTime}
                />
            )}

            <div className={styles.nowPlaying}>
                <div className={styles.visualizer}>
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className={`${styles.bar} ${isPlaying ? styles.barActive : ''}`} />
                    ))}
                </div>
                <div className={styles.metaBlock}>
                    <div className={styles.metaTopRow}>
                        <span className={styles.trackLabel}>
                            {filename?.toUpperCase() || 'UNKNOWN TRACK'}
                        </span>
                        {isBuffering && <span className={styles.buffering}>BUFFERING...</span>}
                    </div>

                    <div className={styles.progressWrapper}>
                        <span className={styles.time}>{formatTime(currentTime)}</span>
                        <div
                            ref={progressRef}
                            className={styles.progressBar}
                            onMouseDown={handleProgressMouseDown}
                            onTouchStart={handleProgressTouchStart}
                        >
                            <div className={styles.progressBg} />
                            <div ref={progressFillRef} className={styles.progressFill} />
                            <div ref={progressThumbRef} className={styles.progressThumb} />
                        </div>
                        <span className={styles.time}>{formatTime(duration)}</span>
                    </div>

                    {error && (
                        <div className={styles.errorGroup}>
                            <span className={styles.errorText}>{error}</span>
                            <button
                                onClick={retryLoad}
                                className={styles.retryButton}
                            >
                                RETRY
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.controlsLeft}>
                    <button onClick={toggleLoop} className={`${styles.iconButton} ${isLoop ? styles.iconButtonActive : ''}`} title="Loop">
                        <Repeat size={15} />
                    </button>
                </div>

                <div className={styles.controlsCenter}>
                    <button onClick={skipBackward} className={styles.iconButton} title="Back 10s">
                        <SkipBack size={17} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className={`${styles.playButton} ${error ? styles.playButtonDisabled : ''}`}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={22} /> : <Play size={22} className={styles.playIcon} />}
                    </button>
                    <button onClick={skipForward} className={styles.iconButton} title="Forward 10s">
                        <SkipForward size={17} />
                    </button>
                </div>

                <div className={styles.controlsRight}>
                    <button onClick={toggleMute} className={styles.iconButton} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <span className={styles.volumeLabel}>{displayedVolume}%</span>
                    <input
                        ref={volumeSliderRef}
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className={styles.volumeSlider}
                    />
                </div>
            </div>
        </div>
    );
}
