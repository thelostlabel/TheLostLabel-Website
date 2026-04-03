"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePlayer } from "@/app/components/PlayerContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ReleaseItem = {
  id: string;
  name: string;
  artistName: string | null;
  image: string | null;
  streamCountText: string | null;
  spotifyUrl: string | null;
  releaseDate: string | null;
};

type LostReleasesSectionProps = {
  releases: ReleaseItem[];
  highlights?: Record<string, string>;
};

function resolveImage(release: ReleaseItem) {
  return release.image?.startsWith("private/")
    ? `/api/files/release/${release.id}`
    : release.image ?? null;
}

function resolvePreviewUrl(release: ReleaseItem) {
  const normalizedName = release.name.trim().toLowerCase();
  if (normalizedName.includes("montagem vozes talentinho")) {
    return "/audio/montagem-vozes-talentinho-super-slowed-heapper.mp3";
  }
  return null;
}

/* ── Single immersive slide for one release ── */
function ReleaseSlide({
  item,
  index,
}: {
  item: {
    id: string;
    artist: string;
    music: string;
    albumArt: string;
    previewUrl: string | null;
    spotifyUrl: string | null;
  };
  index: number;
}) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isThis = currentTrack?.id === item.id;
  const isThisPlaying = isThis && isPlaying;

  const handlePlay = () => {
    if (isThisPlaying) {
      togglePlay();
    } else if (isThis) {
      togglePlay();
    } else {
      playTrack({
        id: item.id,
        name: item.music,
        artist: item.artist,
        image: item.albumArt,
        previewUrl: item.previewUrl,
        spotifyUrl: item.spotifyUrl,
      });
    }
  };

  return (
    <div
      className={`lr-slide lr-slide-${index} absolute inset-0 flex items-center justify-center`}
    >
      {/* BG — blurred album art */}
      <div className="absolute inset-0 z-0">
        <Image
          src={item.albumArt}
          alt=""
          fill
          className="object-cover scale-110"
          unoptimized
          priority={index === 0}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {/* Top/bottom hard fades */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-14 px-6 max-w-5xl w-full">
        {/* Album artwork — large, with subtle shadow */}
        <div
          className={`lr-art-${index} shrink-0 relative group cursor-pointer`}
          onClick={handlePlay}
        >
          <div
            className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden"
            style={{
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src={item.albumArt}
              alt={item.music}
              fill
              className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 256px, 320px"
              unoptimized
            />

            {/* Hover overlay + play */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <div
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {isThisPlaying ? (
                  <Pause size={24} fill="#fff" color="#fff" />
                ) : (
                  <Play size={24} fill="#fff" color="#fff" className="ml-1" />
                )}
              </div>
            </div>

            {/* Now playing bars */}
            {isThisPlaying && (
              <div className="absolute bottom-3 right-3 flex items-end gap-[2px] h-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[2.5px] rounded-full bg-white/80"
                    style={{
                      animation: `lr-eq 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className={`lr-info-${index} flex flex-col items-center md:items-start text-center md:text-left`}>
          <span className="text-[10px] uppercase tracking-[0.35em] text-white/25 font-medium mb-3">
            {item.artist}
          </span>
          <h3
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[1.05] mb-6"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {item.music}
          </h3>

          {/* Play button */}
          <button
            onClick={handlePlay}
            className="group/btn flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              {isThisPlaying ? (
                <Pause size={12} fill="#000" color="#000" />
              ) : (
                <Play size={12} fill="#000" color="#000" className="ml-[1px]" />
              )}
            </div>
            <span className="text-white/70 text-sm font-medium tracking-tight">
              {isThisPlaying ? "Playing" : "Play"}
            </span>
          </button>

          {item.spotifyUrl && (
            <a
              href={item.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-[0.15em]"
            >
              Open in Spotify
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile static card ── */
function MobileReleaseCard({ item }: { item: { id: string; artist: string; music: string; albumArt: string; previewUrl: string | null; spotifyUrl: string | null } }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isThis = currentTrack?.id === item.id;
  const isThisPlaying = isThis && isPlaying;

  const handlePlay = () => {
    if (isThis) { togglePlay(); return; }
    playTrack({ id: item.id, name: item.music, artist: item.artist, image: item.albumArt, previewUrl: item.previewUrl, spotifyUrl: item.spotifyUrl });
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#111' }}>
        <Image src={item.albumArt} alt={item.music} fill style={{ objectFit: 'cover' }} sizes="100vw" unoptimized />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
        <button onClick={handlePlay} style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isThisPlaying ? <Pause size={14} fill="#000" color="#000" /> : <Play size={14} fill="#000" color="#000" style={{ marginLeft: 2 }} />}
        </button>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>{item.artist}</p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{item.music}</p>
        {item.spotifyUrl && (
          <a href={item.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Open in Spotify</a>
        )}
      </div>
    </div>
  );
}

/* ── Main section ── */
export function LostReleasesSection({ releases }: LostReleasesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const items = releases
    .map((release) => {
      const image = resolveImage(release);
      if (!image) return null;
      return {
        id: release.id,
        artist: release.artistName ?? "LOST.",
        music: release.name,
        albumArt: image,
        previewUrl: resolvePreviewUrl(release),
        spotifyUrl: release.spotifyUrl ?? null,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      artist: string;
      music: string;
      albumArt: string;
      previewUrl: string | null;
      spotifyUrl: string | null;
    }>;

  const count = items.length;

  useEffect(() => {
    if (count === 0 || isMobile) return;

    const ctx = gsap.context(() => {
      /*
       * Total scroll distance:
       *   - intro header reveal
       *   - for each slide: fade in + hold + fade out
       *   - final fade out
       */
      const perSlide = 1.5;  // timeline units per slide
      const totalDur = 1 + count * perSlide + 0.5;

      // Header
      gsap.set(".lr-rule", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".lr-tag", { autoAlpha: 0, y: 20 });
      gsap.set(".lr-heading", { autoAlpha: 0, y: 30, filter: "blur(8px)" });

      // All slides hidden
      items.forEach((_, i) => {
        gsap.set(`.lr-slide-${i}`, { autoAlpha: 0 });
        gsap.set(`.lr-art-${i}`, { scale: 0.88, y: 30 });
        gsap.set(`.lr-info-${i}`, { autoAlpha: 0, y: 40 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${count * 1800 + 1200}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // ── Intro header ──
      tl.to(".lr-rule", { scaleX: 1, ease: "none", duration: 0.15 }, 0)
        .to(".lr-tag", { autoAlpha: 1, y: 0, ease: "none", duration: 0.2 }, 0.05)
        .to(".lr-heading", { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "none", duration: 0.3 }, 0.1);

      // Fade header out
      tl.to([".lr-rule", ".lr-tag", ".lr-heading"], {
        autoAlpha: 0, y: -20, ease: "none", duration: 0.25,
      }, 0.7);

      // ── Each release slide ──
      items.forEach((_, i) => {
        const slideStart = 1 + i * perSlide;

        // Fade in slide
        tl.to(`.lr-slide-${i}`, { autoAlpha: 1, ease: "none", duration: 0.3 }, slideStart);
        tl.to(`.lr-art-${i}`, {
          scale: 1, y: 0, ease: "none", duration: 0.35,
        }, slideStart + 0.05);
        tl.to(`.lr-info-${i}`, {
          autoAlpha: 1, y: 0, ease: "none", duration: 0.3,
        }, slideStart + 0.15);

        // Hold
        // (implicit from gap to next fade)

        // Fade out slide (except last — that fades in the section fade-out)
        if (i < count - 1) {
          const fadeOut = slideStart + perSlide - 0.35;
          tl.to(`.lr-slide-${i}`, { autoAlpha: 0, ease: "none", duration: 0.3 }, fadeOut);
        }
      });

      // ── Final fade out of last slide + section ──
      const endAt = 1 + (count - 1) * perSlide + perSlide - 0.1;
      tl.to(`.lr-slide-${count - 1}`, {
        autoAlpha: 0, ease: "none", duration: 0.4,
      }, endAt);

    }, sectionRef);

    return () => ctx.revert();
  }, [count, isMobile]);

  if (items.length === 0) return null;

  // Mobile: simple static card list, no pin/scrub
  if (isMobile) {
    return (
      <div style={{ background: '#050505', padding: '60px 20px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Catalog</p>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', margin: 0 }}>Most played from the catalog.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <MobileReleaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="relative w-screen h-screen overflow-hidden bg-black"
    >
      {/* Header — shown briefly then fades */}
      <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="lr-rule h-px w-16 bg-white/20 mb-2" />
          <div className="lr-tag text-[10px] uppercase tracking-[0.4em] text-white/30 font-medium">
            Catalog
          </div>
          <h2
            className="lr-heading text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl leading-[1.05]"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Most played from
            <br className="hidden md:block" />
            {" "}the catalog.
          </h2>
        </div>
      </div>

      {/* Release slides stacked on top of each other */}
      <div className="absolute inset-0 z-20">
        {items.map((item, i) => (
          <ReleaseSlide key={item.id} item={item} index={i} />
        ))}
      </div>

      <style>{`
        @keyframes lr-eq {
          0% { height: 3px; }
          100% { height: 14px; }
        }
      `}</style>
    </div>
  );
}
