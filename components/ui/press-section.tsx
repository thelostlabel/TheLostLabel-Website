"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PRESS = [
  { name: "Spotify Editorial",  detail: "Official Phonk Playlist — #74" },
  { name: "SoundCloud Charts",  detail: "Trending — Phonk & Trap" },
  { name: "Audiomack",          detail: "Rising Artist Feature" },
  { name: "SubmitHub",          detail: "Curator's Pick" },
];

export function PressSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".prs-label", { autoAlpha: 0 });

      const items = gsap.utils.toArray<HTMLElement>(".prs-item");
      items.forEach((el, i) => {
        gsap.set(el, { autoAlpha: 0, y: 16, scale: 0.95 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 40%",
          scrub: 1,
        },
      });

      tl.to(".prs-label", { autoAlpha: 1, ease: "none", duration: 0.2 }, 0);

      items.forEach((el, i) => {
        tl.to(el, { autoAlpha: 1, y: 0, scale: 1, ease: "none", duration: 0.2 }, 0.1 + i * 0.08);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-black text-white py-20 md:py-28">
      <div className="w-full max-w-4xl mx-auto px-6 md:px-10 flex flex-col items-center gap-10">
        <div className="prs-label text-[11px] font-semibold uppercase tracking-[0.16em] text-white/20 text-center">
          Featured On
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {PRESS.map((p, i) => (
            <div
              key={i}
              className={`prs-item flex flex-col items-center gap-1.5 py-5 px-4 rounded-2xl text-center`}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-white/50 font-bold text-sm leading-tight">{p.name}</span>
              <span className="text-white/18 text-[10px] leading-snug">{p.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
