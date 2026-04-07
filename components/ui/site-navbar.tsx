"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TextRoll } from "@/components/ui/animated-menu";
import { HandwrittenLogo } from "@/components/ui/handwritten-logo";
import { usePublicSettings } from "@/app/components/PublicSettingsContext";

const NAV_ITEMS = [
  { label: "Home",         href: "/",              index: "00" },
  { label: "Releases",     href: "/releases",      index: "01" },
  { label: "Artists",      href: "/artists",       index: "02" },
  { label: "Submit Demo",  href: "/auth/register", index: "03" },
  { label: "Sign In",      href: "/auth/login",    index: "04" },
  { label: "Dashboard",    href: "/dashboard",     index: "05" },
];

type SocialEntry = { label: string; href: string };

function buildSocials(settings: { instagram?: string; spotify?: string; youtube?: string; twitter?: string; facebook?: string; discord?: string }): SocialEntry[] {
  const map: { key: keyof typeof settings; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "spotify",   label: "Spotify" },
    { key: "youtube",   label: "YouTube" },
    { key: "twitter",   label: "Twitter" },
    { key: "discord",   label: "Discord" },
    { key: "facebook",  label: "Facebook" },
  ];
  return map.filter((m) => settings[m.key]).map((m) => ({ label: m.label, href: settings[m.key]! }));
}

const listVariants = {
  closed: {},
  open:   { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const itemVariants = {
  closed: { y: 50, opacity: 0, filter: "blur(8px)" },
  open:   { y: 0,  opacity: 1, filter: "blur(0px)", transition: { ease: [0.33, 1, 0.68, 1] as [number, number, number, number], duration: 0.65 } },
};

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const publicSettings = usePublicSettings();
  const socials = useMemo(() => buildSocials(publicSettings), [publicSettings]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ── Fixed top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-5">
        <Link
          href="/"
          className="text-white font-black text-2xl tracking-tighter leading-none select-none"
          onClick={() => setOpen(false)}
          style={{ textShadow: "0 0 30px rgba(255,255,255,0.15)" }}
        >
          {publicSettings.brandingDotName || "LOST."}
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="relative z-[110] flex flex-col justify-center items-end gap-[5px] w-10 h-10 focus:outline-none"
        >
          <motion.span
            animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            className="block h-[1.5px] bg-white origin-center"
            style={{ width: "28px" }}
          />
          <motion.span
            animate={open ? { opacity: 0, x: 8 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="block h-[1.5px] bg-white"
            style={{ width: "20px" }}
          />
          <motion.span
            animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            className="block h-[1.5px] bg-white origin-center"
            style={{ width: "28px" }}
          />
        </button>
      </header>

      {/* ── Fullscreen overlay — always in DOM, shown/hidden via pointer-events + opacity ── */}
      <motion.div
        animate={open ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: open ? 0.45 : 0.35, ease: [0.33, 1, 0.68, 1] }}
        className="fixed inset-0 z-99 flex flex-col bg-black"
        style={{
          pointerEvents: open ? "auto" : "none",
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.025) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.018) 0%, transparent 50%)
          `,
        }}
      >
        {/* Grain — desktop only */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.035] hidden md:block"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Divider under top bar */}
        <div
          className="absolute top-18 left-6 right-6 md:left-10 md:right-10 h-px z-10"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)" }}
        />

        {/* Nav items */}
        <nav className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 px-8">
          <motion.ul
            variants={listVariants}
            animate={open ? "open" : "closed"}
            className="flex flex-col items-center gap-2 w-full"
          >
            {NAV_ITEMS.map((item) => (
              <motion.li
                key={item.href}
                variants={itemVariants}
                className="w-full flex justify-center"
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group relative flex items-baseline gap-4 py-1"
                  tabIndex={open ? 0 : -1}
                >
                  <span className="text-white/20 text-xs font-mono tabular-nums w-6 text-right shrink-0 mb-1">
                    {item.index}
                  </span>
                  <TextRoll
                    center
                    className="whitespace-nowrap text-[clamp(2rem,11vw,4.25rem)] sm:text-[clamp(2.8rem,8vw,6rem)] font-black uppercase tracking-[-0.04em] text-white"
                  >
                    {item.label}
                  </TextRoll>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        {/* Bottom bar */}
        <motion.div
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: open ? 0.45 : 0, duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex items-end justify-between px-8 md:px-12 pb-8 md:pb-10"
        >
          <div style={{ width: "clamp(120px, 20vw, 200px)", opacity: 0.18, filter: "drop-shadow(0 0 12px rgba(255,255,255,0.08))" }}>
            <HandwrittenLogo
              text={publicSettings.brandingFullName || "The Lost Company"}
              animate={false}
              color="#ffffff"
              font="bofly"
            />
          </div>
          <div className="flex items-center gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                className="text-white/30 hover:text-white/80 text-xs font-medium tracking-wider uppercase transition-colors duration-300"
              >
                {s.label}
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
