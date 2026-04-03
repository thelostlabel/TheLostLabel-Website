"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ArtistItem = {
  id: string;
  name: string;
  image: string | null;
  genres: string | null;
  monthlyListeners: number | null;
};

type Props = { artists: ArtistItem[] };

function getGenre(raw: string | null) {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr[0] : raw.split(",")[0];
  } catch {
    return raw.split(",")[0].trim();
  }
}

function formatListeners(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function ArtistCard({ artist }: { artist: ArtistItem }) {
  const genre = getGenre(artist.genres);
  const listeners = formatListeners(artist.monthlyListeners);

  return (
    <div
      className="relative shrink-0 mx-2 group cursor-default"
      style={{ width: "170px" }}
    >
      {/* Image with cinematic overlay */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "3 / 4",
          borderRadius: "14px",
        }}
      >
        {artist.image ? (
          <Image
            src={artist.image.startsWith("private/") ? `/api/files/artist/${artist.id}` : artist.image}
            alt={artist.name}
            fill
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
            sizes="170px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.03] text-white/8 text-5xl font-black">
            {artist.name[0]}
          </div>
        )}

        {/* Bottom gradient — always visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)",
          }}
        />

        {/* Film grain on card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
          }}
        />

        {/* Hover light sweep */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
          }}
        />

        {/* Info at bottom of card */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8">
          <span
            className="block text-white font-bold text-[13px] leading-tight truncate"
            style={{
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {artist.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {genre && (
              <span className="text-white/35 text-[9px] uppercase tracking-[0.08em] truncate">
                {genre}
              </span>
            )}
            {genre && listeners && <span className="text-white/15 text-[8px]">·</span>}
            {listeners && (
              <span className="text-white/20 text-[9px] shrink-0 tabular-nums">
                {listeners}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArtistShowcaseSection({ artists }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  const row1 = artists.slice(0, Math.ceil(artists.length / 2));
  const row2 = artists.slice(Math.ceil(artists.length / 2));

  const row1Items = [...row1, ...row1, ...row1];
  const row2Items = [...row2, ...row2, ...row2];

  useEffect(() => {
    if (artists.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(".asc-bg", { scale: 1.12, autoAlpha: 0 });
      gsap.set(".asc-rule", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".asc-label", { autoAlpha: 0, y: 20 });
      gsap.set(".asc-heading", { autoAlpha: 0, y: 32, filter: "blur(8px)" });
      gsap.set(".asc-tracks", { autoAlpha: 0, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2800",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      tl.to(".asc-bg",      { scale: 1, autoAlpha: 1, ease: "none", duration: 0.4 }, 0)
        .to(".asc-rule",     { scaleX: 1, ease: "none", duration: 0.2 }, 0.15)
        .to(".asc-label",    { autoAlpha: 1, y: 0, ease: "none", duration: 0.2 }, 0.2)
        .to(".asc-heading",  { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "none", duration: 0.3 }, 0.3)
        .to(".asc-tracks",   { autoAlpha: 1, y: 0, ease: "none", duration: 0.35 }, 0.45)
        .to({}, { duration: 1.0 })

        // Fade out
        .to([".asc-heading", ".asc-label", ".asc-rule"], {
          autoAlpha: 0, y: -30, ease: "none", duration: 0.25,
        })
        .to(".asc-tracks", { autoAlpha: 0, y: -20, ease: "none", duration: 0.25 }, "<0.05")
        .to(".asc-bg", { autoAlpha: 0, ease: "none", duration: 0.3 }, "<0.1");
    }, sectionRef);

    // Marquee
    const speed = 30;
    let started = false;

    function startAll() {
      if (started) return;
      started = true;
      marquee(track1Ref, 1);
      marquee(track2Ref, -1);
    }

    function marquee(ref, dir) {
      const el = ref.current;
      if (!el) return;
      const w = el.scrollWidth / 3;
      gsap.set(el, { x: dir === -1 ? -w : 0 });
      gsap.to(el, {
        x: dir === 1 ? -w : 0,
        duration: w / speed,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => {
            const v = parseFloat(x);
            if (dir === 1 && v <= -w) return `${v + w}px`;
            if (dir === -1 && v >= 0) return `${v - w}px`;
            return `${v}px`;
          },
        },
      });
    }

    const t = setTimeout(startAll, 800);

    return () => {
      clearTimeout(t);
      ctx.revert();
      gsap.killTweensOf(track1Ref.current);
      gsap.killTweensOf(track2Ref.current);
    };
  }, [artists.length]);

  if (artists.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-screen h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Background */}
      <div className="asc-bg absolute inset-0 z-0">
        <Image src="/lostbanner2.png" alt="" fill className="object-cover" priority={false} />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(0,0,0,0.7) 100%)",
        }} />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
        }}
      />

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-20"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-20"
        style={{ background: "linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)" }} />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center mb-12 px-6">
        <div className="asc-rule h-px w-12 bg-white/20 mb-1" />
        <div className="asc-label text-[10px] font-medium uppercase tracking-[0.35em] text-white/25">
          Roster
        </div>
        <h2
          className="asc-heading text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-[-0.04em] leading-tight"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          The artists behind
          <br className="hidden md:block" />
          {" "}the sound.
        </h2>
      </div>

      {/* Marquee rows */}
      <div className="asc-tracks relative z-10 flex flex-col gap-4 w-full overflow-hidden">
        <div className="flex" style={{ width: "max-content" }} ref={track1Ref}>
          {row1Items.map((artist, i) => (
            <ArtistCard key={`r1-${i}`} artist={artist} />
          ))}
        </div>

        {row2.length > 0 && (
          <div className="flex" style={{ width: "max-content" }} ref={track2Ref}>
            {row2Items.map((artist, i) => (
              <ArtistCard key={`r2-${i}`} artist={artist} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
