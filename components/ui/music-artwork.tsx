"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { usePlayer } from '@/app/components/PlayerContext';

interface MusicArtworkProps {
  trackId?: string;
  artist: string;
  music: string;
  albumArt: string;
  isSong: boolean;
  isLoading?: boolean;
  previewUrl?: string | null;
  spotifyUrl?: string | null;
}

export default function MusicArtwork({
  trackId,
  artist,
  music,
  albumArt,
  isSong,
  isLoading = false,
  previewUrl = null,
  spotifyUrl = null,
}: MusicArtworkProps) {
  const { playTrack, currentTrack, isPlaying: globalIsPlaying, togglePlay } = usePlayer();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);

  const resolvedTrackId = trackId ?? (spotifyUrl
    ? spotifyUrl.split('/').pop()?.split('?')[0] ?? music
    : music);

  const isThisPlaying = currentTrack?.id === resolvedTrackId && globalIsPlaying;

  const handlePlayPause = () => {
    if (isThisPlaying) {
      togglePlay();
    } else if (currentTrack?.id === resolvedTrackId) {
      startTimeRef.current = Date.now();
      togglePlay();
    } else {
      startTimeRef.current = Date.now();
      playTrack({
        id: resolvedTrackId,
        name: music,
        artist,
        image: albumArt,
        previewUrl,
        spotifyUrl,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-52 sm:w-64 aspect-[3/4] rounded-2xl bg-white/[0.03] animate-pulse" />
    );
  }

  return (
    <div
      className="relative group cursor-pointer w-52 sm:w-64"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlayPause}
    >
      {/* Card */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
        {/* Album art with ken burns on hover */}
        <Image
          src={albumArt}
          alt={`${music} Cover`}
          fill
          className={`object-cover transition-transform duration-[2s] ease-out ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 208px, 256px"
          unoptimized
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/[0.03] animate-pulse" />
        )}

        {/* Film grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-10"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
          }}
        />

        {/* Bottom gradient for text */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 35%, transparent 60%)",
          }}
        />

        {/* Hover light sweep */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
          }}
        />

        {/* Play button — center, appears on hover */}
        <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {isThisPlaying
              ? <Pause size={20} fill="#fff" color="#fff" />
              : <Play size={20} fill="#fff" color="#fff" className="ml-1" />
            }
          </div>
        </div>

        {/* Now playing indicator */}
        {isThisPlaying && !isHovered && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex items-end gap-[3px] h-5">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-white/80"
                  style={{
                    animation: `eq-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-4 pt-10">
          <div
            className="text-white font-bold text-[15px] leading-tight truncate"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            {music}
          </div>
          <div className="text-white/40 text-[11px] mt-1 truncate tracking-wide">
            {artist}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes eq-bar {
          0% { height: 4px; }
          100% { height: 18px; }
        }
      `}</style>
    </div>
  );
}
