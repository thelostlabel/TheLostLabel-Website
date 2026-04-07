"use client";
import { useState, useEffect, useRef, useMemo, SyntheticEvent } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat } from 'lucide-react';
import styles from './StudioPlayer.module.css';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function getAppliedVolume(sliderValue: number): number {
    const safeValue = clamp(sliderValue, 0, 1);
    return safeValue ** 2;
}

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || !Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface StudioPlayerProps {
    src?: string;
    filename?: string;
}

export default function StudioPlayer(props: StudioPlayerProps) {
    // Key ensures component resets when src changes
    return <StudioPlayerInner key={props.src || 'empty-track'} {...props} />;
}

function StudioPlayerInner({ src, filename }: StudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeSliderRef = useRef<HTMLInputElement>(null);
    const animationRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate progress percentage for CSS
    const progressPercent = useMemo(() => {
        if (!duration || duration <= 0) return 0;
        return clamp((currentTime / duration) * 100, 0, 100);
    }, [currentTime, duration]);

    // Volume and Loop sync
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = getAppliedVolume(volume);
        audioRef.current.loop = isLoop;
        audioRef.current.muted = isMuted;
    }, [isLoop, isMuted, volume]);

    // Animation loop for smooth progress bar updates
    useEffect(() => {
        const updateProgress = () => {
            if (audioRef.current && !isDragging) {
                setCurrentTime(audioRef.current.currentTime);
            }
            animationRef.current = requestAnimationFrame(updateProgress);
        };

        if (isPlaying && !isDragging) {
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
    }, [isPlaying, isDragging]);

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

    const handleError = () => {
        const audio = audioRef.current;
        let errorMessage = "Unable to load audio file.";

        if (audio && audio.error) {
            console.error("Detailed audio error:", {
                code: audio.error.code,
                message: audio.error.message
            });

            switch (audio.error.code) {
                case 1: errorMessage = "Playback aborted."; break;
                case 2: errorMessage = "Network error. Please check your connection."; break;
                case 3: errorMessage = "Audio decoding failed."; break;
                case 4: errorMessage = "Audio format not supported or file not found."; break;
            }
        }

        setError(errorMessage);
        setIsPlaying(false);
        setIsBuffering(false);
    };

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
            // Some browsers block play() without user interaction
            if ((err as DOMException).name === 'NotAllowedError') {
                setError("Playback blocked. Please click play again.");
            } else {
                setError("Unable to play audio. Please try again.");
            }
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

    const toggleMute = () => setIsMuted(prev => !prev);

    const toggleLoop = () => setIsLoop(prev => !prev);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (newVol === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    // Progress bar seeking
    const calculateSeekPosition = (clientX: number): number => {
        const bar = progressRef.current;
        if (!bar || duration <= 0) return 0;
        const rect = bar.getBoundingClientRect();
        const x = clamp(clientX - rect.left, 0, rect.width);
        return (x / rect.width) * duration;
    };

    const handleProgressMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const seekTime = calculateSeekPosition(e.clientX);
        setCurrentTime(seekTime);

        const handleMouseMove = (ev: MouseEvent) => {
            const t = calculateSeekPosition(ev.clientX);
            setCurrentTime(t);
        };

        const handleMouseUp = (ev: MouseEvent) => {
            const finalTime = calculateSeekPosition(ev.clientX);
            if (audioRef.current) {
                audioRef.current.currentTime = finalTime;
            }
            setCurrentTime(finalTime);
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Touch support
    const handleProgressTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        const seekTime = calculateSeekPosition(touch.clientX);
        setCurrentTime(seekTime);

        const handleTouchMove = (ev: TouchEvent) => {
            const t = calculateSeekPosition(ev.touches[0].clientX);
            setCurrentTime(t);
        };

        const handleTouchEnd = (ev: TouchEvent) => {
            const t = calculateSeekPosition(ev.changedTouches[0].clientX);
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

    const displayedVolume = Math.round((isMuted ? 0 : volume) * 100);

    // Apply volume variable for CSS
    useEffect(() => {
        if (volumeSliderRef.current) {
            volumeSliderRef.current.style.setProperty('--sp-volume', `${displayedVolume}%`);
        }
    }, [displayedVolume]);

    // Safety cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current.load();
            }
        };
    }, []);

    return (
        <div className={styles.studioPlayer}>
            {src && (
                <audio
                    ref={audioRef}
                    src={src}
                    preload="auto"
                    playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                    onDurationChange={handleDurationChange}
                    onEnded={handleEnded}
                    onWaiting={handleWaiting}
                    onCanPlay={handleCanPlay}
                    onError={handleError}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onTimeUpdate={syncCurrentTime}
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
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progressPercent}%` || '0%' }}
                            />
                            <div
                                className={styles.progressThumb}
                                style={{ left: `${progressPercent}%` || '0%' }}
                            />
                        </div>
                        <span className={styles.time}>{formatTime(duration)}</span>
                    </div>

                    {error && (
                        <div className={styles.errorGroup}>
                            <span className={styles.errorText}>{error}</span>
                            <button onClick={retryLoad} className={styles.retryButton}>
                                RETRY
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.controlsLeft}>
                    <button
                        onClick={toggleLoop}
                        className={`${styles.iconButton} ${isLoop ? styles.iconButtonActive : ''}`}
                        title="Loop"
                    >
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
