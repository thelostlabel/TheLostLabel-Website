"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef(null);

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

    const playTrack = (track) => {
        if (!track?.previewUrl) {
            console.warn("No preview URL for track:", track);
            return;
        }

        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        setCurrentTrack(track);
        setIsPlaying(true);
        setIsExpanded(true); // Auto-expand when starting new track

        if (audioRef.current) {
            audioRef.current.src = track.previewUrl;
            audioRef.current.load();
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed:", error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const togglePlay = () => {
        if (currentTrack && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Playback failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seek = (time) => {
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
    return useContext(PlayerContext);
}
