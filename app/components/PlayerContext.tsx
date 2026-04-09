"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
    id: string;
    name: string;
    artist?: string;
    image?: string;
    previewUrl?: string;
    spotifyUrl?: string;
}

interface PlayerContextValue {
    currentTrack: Track | null;
    isPlaying: boolean;
    isExpanded: boolean;
    setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    volume: number;
    setVolume: React.Dispatch<React.SetStateAction<number>>;
    progress: number;
    duration: number;
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

interface PlayerProviderProps {
    children: React.ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            setProgress(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = (track: Track) => {
        // Allow tracks with spotifyUrl even if no previewUrl
        if (!track?.previewUrl && !track?.spotifyUrl) {
            console.warn("No previewUrl or spotifyUrl for track:", track);
            return;
        }

        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        setCurrentTrack(track);
        setIsPlaying(true);
        setIsExpanded(true); // Auto-expand when starting new track

        if (track.previewUrl && audioRef.current) {
            audioRef.current.src = track.previewUrl;
            audioRef.current.load();
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise.catch((error: unknown) => {
                    console.error("Playback failed:", error instanceof Error ? error.message : "Unknown error");
                    setIsPlaying(false);
                });
            }
        } else if (!track.previewUrl) {
            // Spotify-only track — just show the player bar, no audio element
            setIsPlaying(false);
        }
    };

    const togglePlay = () => {
        if (currentTrack && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((e: unknown) => console.error("Playback failed:", e instanceof Error ? e.message : "Unknown error"));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTrack(null);
        setIsExpanded(false);
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            isExpanded,
            setIsExpanded,
            volume,
            setVolume,
            progress,
            duration,
            playTrack,
            togglePlay,
            seek,
            closePlayer
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    return useContext(PlayerContext) as PlayerContextValue;
}
