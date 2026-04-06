"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePublicSettings } from "@/app/components/PublicSettingsContext";

const LINKS = [
  { label: "Submit Demo", href: "/auth/register" },
  { label: "Sign In",     href: "/auth/login" },
  { label: "Dashboard",  href: "/dashboard" },
];

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  spotify: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  ),
  youtube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  twitter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  discord: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

type SocialItem = { key: string; label: string; href: string; icon: React.ReactNode };

function buildSocials(settings: { instagram?: string; spotify?: string; youtube?: string; twitter?: string; facebook?: string; discord?: string }): SocialItem[] {
  const map: { key: keyof typeof settings; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "spotify",   label: "Spotify" },
    { key: "youtube",   label: "YouTube" },
    { key: "twitter",   label: "Twitter" },
    { key: "discord",   label: "Discord" },
    { key: "facebook",  label: "Facebook" },
  ];
  return map
    .filter((m) => settings[m.key])
    .map((m) => ({ key: m.key, label: m.label, href: settings[m.key]!, icon: SOCIAL_ICONS[m.key] }));
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const publicSettings = usePublicSettings();
  const socials = useMemo(() => buildSocials(publicSettings), [publicSettings]);

  return (
    <footer className="relative w-full text-white border-t border-white/[0.12]" style={{ background: "#0c0c0c" }}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="font-black text-2xl tracking-[-0.06em] leading-none w-fit"
              style={{
                backgroundImage: "linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.55) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {publicSettings.brandingDotName || "LOST."}
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-[220px]">
              Independent music label. Artist-first, always.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-1">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/45 hover:text-white/90 transition-colors duration-200"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-1">Navigation</span>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/55 hover:text-white/90 text-sm transition-colors duration-200 w-fit"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Ready to join?</span>
            <p className="text-white/50 text-sm leading-relaxed">
              Submit your demo today. We review every track and respond within 30 days.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-tight transition-all duration-200 hover:-translate-y-0.5 w-fit"
              style={{
                background: "#fff",
                color: "#0a0a0a",
                boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
              }}
            >
              Submit Demo
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.10] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white/40 text-xs">© {year} {publicSettings.brandingDotName || "LOST."} All rights reserved.</span>
          <span className="text-white/30 text-xs">Independent Music Label</span>
        </div>
      </div>
    </footer>
  );
}
