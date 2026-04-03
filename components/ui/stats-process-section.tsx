"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  artistCount?: number;
  releaseCount?: number;
};

const STEPS = [
  {
    title: "Submit",
    desc: "Upload your track. All genres welcome — phonk, ambient, trap, whatever you make.",
  },
  {
    title: "Review",
    desc: "Every submission gets listened to. If it fits, we reach out within 2 weeks.",
  },
  {
    title: "Release",
    desc: "Artist-first terms. You keep your rights — we handle distribution and playlists.",
  },
];

export function StatsProcessSection({ artistCount = 50, releaseCount = 80 }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const STATS = [
    { prefix: "",  value: 75,           suffix: "M+", label: "Streams" },
    { prefix: "",  value: artistCount,  suffix: "+",  label: "Artists" },
    { prefix: "#", value: 74,           suffix: "",   label: "Spotify Chart" },
    { prefix: "",  value: releaseCount, suffix: "+",  label: "Releases" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Phase 1 (stats) initial ──
      STATS.forEach((_, i) => {
        gsap.set(`.xp-num-${i}`, { autoAlpha: 0, y: 80, scale: 0.7 });
        gsap.set(`.xp-label-${i}`, { autoAlpha: 0 });
      });
      gsap.set(".xp-stat-glow", { autoAlpha: 0, scale: 0.5 });

      // ── Phase 2 (process) initial ──
      gsap.set(".xp-proc-heading", { autoAlpha: 0, y: 40 });
      STEPS.forEach((_, i) => {
        gsap.set(`.xp-card-${i}`, { autoAlpha: 0, y: 60, rotateX: -15, scale: 0.9 });
      });
      gsap.set(".xp-proc-line", { scaleX: 0, transformOrigin: "left" });

      // ── Timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=5000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // ═══ PHASE 1: Big numbers slam in ═══
      // Center glow pulses in
      tl.to(".xp-stat-glow", { autoAlpha: 1, scale: 1, ease: "none", duration: 0.3 }, 0);

      // Numbers come in with impact — fast, staggered
      STATS.forEach((stat, i) => {
        const at = 0.08 + i * 0.18;

        tl.to(`.xp-num-${i}`, {
          autoAlpha: 1, y: 0, scale: 1,
          ease: "none", duration: 0.2,
        }, at);

        tl.to(`.xp-label-${i}`, {
          autoAlpha: 1,
          ease: "none", duration: 0.15,
        }, at + 0.12);

        // Counter
        const obj = { val: 0 };
        tl.to(obj, {
          val: stat.value, ease: "none", duration: 0.25,
          onUpdate() {
            const el = document.querySelector(`.xp-val-${i}`);
            if (el) el.textContent = Math.round(obj.val).toString();
          },
        }, at);
      });

      // Hold on stats
      tl.to({}, { duration: 1.0 });

      // ═══ TRANSITION: Stats fade up ═══
      const fadeAt = 1.8;
      STATS.forEach((_, i) => {
        tl.to(`.xp-num-${i}`, { autoAlpha: 0, y: -30, ease: "none", duration: 0.2 }, fadeAt + i * 0.04);
        tl.to(`.xp-label-${i}`, { autoAlpha: 0, ease: "none", duration: 0.15 }, fadeAt + i * 0.04);
      });
      tl.to(".xp-stat-glow", { autoAlpha: 0, ease: "none", duration: 0.2 }, fadeAt);

      // ═══ PHASE 2: Process cards ═══
      const procAt = 2.4;

      tl.to(".xp-proc-heading", { autoAlpha: 1, y: 0, ease: "none", duration: 0.25 }, procAt);
      tl.to(".xp-proc-line", { scaleX: 1, ease: "none", duration: 0.5 }, procAt + 0.15);

      STEPS.forEach((_, i) => {
        tl.to(`.xp-card-${i}`, {
          autoAlpha: 1, y: 0, rotateX: 0, scale: 1,
          ease: "none", duration: 0.28,
        }, procAt + 0.25 + i * 0.22);
      });

      // Hold
      tl.to({}, { duration: 1.0 });

      // Fade out entire section
      const fadeOutAt = tl.duration();
      STEPS.forEach((_, i) => {
        tl.to(`.xp-card-${i}`, { autoAlpha: 0, y: -20, ease: "none", duration: 0.2 }, fadeOutAt + i * 0.04);
      });
      tl.to(".xp-proc-heading", { autoAlpha: 0, y: -20, ease: "none", duration: 0.2 }, fadeOutAt);
      tl.to(".xp-proc-line", { autoAlpha: 0, ease: "none", duration: 0.15 }, fadeOutAt);

    }, sectionRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-screen h-screen overflow-hidden bg-black text-white"
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundSize: "60px 60px",
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />

      {/* ══ PHASE 1: Stats (absolutely positioned, fades out) ══ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Center glow */}
        <div
          className="xp-stat-glow absolute pointer-events-none"
          style={{
            width: "600px", height: "400px",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-x-12 md:gap-x-20 gap-y-12">
          {STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div
                className={`xp-num-${i} font-black leading-[0.85] tracking-[-0.04em]`}
                style={{
                  fontSize: "clamp(4rem, 8vw, 7rem)",
                  background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.3) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 60px rgba(255,255,255,0.08))",
                }}
              >
                {stat.prefix}<span className={`xp-val-${i}`}>0</span>{stat.suffix}
              </div>
              <span className={`xp-label-${i} mt-3 text-white/25 text-[11px] font-semibold uppercase tracking-[0.2em]`}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PHASE 2: Process (absolutely positioned, fades in) ══ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6" style={{ perspective: "1000px" }}>
        <div className="w-full max-w-4xl flex flex-col items-center gap-10">
          {/* Heading */}
          <div className="xp-proc-heading flex flex-col items-center gap-3 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/20">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-[-0.04em] leading-tight">
              From demo to{" "}
              <span style={{
                background: "linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                everywhere.
              </span>
            </h2>
          </div>

          {/* Line */}
          <div className="xp-proc-line h-px w-full max-w-2xl" style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)",
          }} />

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 w-full">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`xp-card-${i} relative overflow-hidden rounded-2xl p-7 md:p-8 group`}
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.4)",
                }}
              >
                {/* Big ghost number */}
                <div
                  className="absolute -top-2 -right-1 font-black select-none pointer-events-none leading-none"
                  style={{
                    fontSize: "clamp(5rem, 8vw, 8rem)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 80%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Hover sheen */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)" }}
                />

                <div className="relative z-10 flex flex-col gap-3">
                  <h3 className="text-white font-bold text-xl leading-tight">{step.title}</h3>
                  <p className="text-white/30 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
