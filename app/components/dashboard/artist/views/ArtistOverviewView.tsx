"use client";

import { type CSSProperties, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Disc3,
  Flame,
  Music2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Waves,
  Zap,
  Headphones,
  BarChart3,
} from "lucide-react";
import { Avatar, Badge, Chip } from "@heroui/react";

import type { AppSessionUser } from "@/lib/auth-types";
import type { ArtistOverviewStats, DashboardDemo } from "@/app/components/dashboard/types";
import {
  handleImageError,
  resolveImageSrc,
} from "@/app/components/dashboard/artist/lib/shared";
import FeaturedAnnouncements from "./FeaturedAnnouncements";

// ── Glass Card primitive ──────────────────────────────────────────────────────
// Styles live in globals.css (.ds-glass) — change once, applies everywhere.
type GlassCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

function GlassCard({ children, className = "", style }: GlassCardProps) {
  return (
    <div className={`ds-glass ${className}`} style={style}>
      {children}
    </div>
  );
}

type ArtistOverviewViewProps = {
  stats: ArtistOverviewStats;
  recentReleases: Array<Record<string, unknown>>;
  demos?: DashboardDemo[];
  onNavigate: (view: string) => void;
  sessionUser: AppSessionUser | null;
};

const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const demoStatusColor = (
  status: string,
): "default" | "warning" | "success" | "danger" => {
  switch (status) {
    case "reviewing": return "warning";
    case "approved": return "success";
    case "rejected": return "danger";
    default: return "default";
  }
};

// ── Activity Feed ────────────────────────────────────────────────────────────
type ActivityItem = { id: string; icon: ReactNode; color: string; label: ReactNode; time: string };

function ActivityFeed({
  demos,
  recentReleases,
  stats,
}: {
  demos: DashboardDemo[];
  recentReleases: Array<Record<string, unknown>>;
  stats: ArtistOverviewStats;
}) {
  const items: ActivityItem[] = [];

  const statusMeta: Record<string, { color: string; verb: string }> = {
    approved: { color: "#22c55e", verb: "approved" },
    rejected: { color: "#ef4444", verb: "rejected" },
    reviewing: { color: "#f59e0b", verb: "under review" },
    pending: { color: "rgba(156,163,175,0.7)", verb: "pending" },
  };

  demos.slice(0, 3).forEach((demo) => {
    const s = statusMeta[demo.status ?? "pending"] ?? statusMeta.pending;
    items.push({
      id: `demo-${demo.id}`,
      icon: <Upload size={12} />,
      color: s.color,
      label: <span>Demo <span className="font-bold text-foreground/90">{String(demo.title ?? demo.name ?? "Untitled")}</span> is {s.verb}</span>,
      time: demo.createdAt ? new Date(String(demo.createdAt)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Recently",
    });
  });

  recentReleases.slice(0, 2).forEach((r, i) => {
    items.push({
      id: `release-${String(r.id ?? i)}`,
      icon: <Disc3 size={12} />,
      color: "#e44ccf",
      label: <span>Release <span className="font-bold text-foreground/90">{String(r.name ?? "Untitled")}</span> published</span>,
      time: r.releaseDate ? new Date(String(r.releaseDate)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Recently",
    });
  });

  if (Number(stats.balance || 0) > 0) {
    items.push({
      id: "balance",
      icon: <Zap size={12} />,
      color: "#facc15",
      label: <span><span className="font-bold text-foreground/90">${Number(stats.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> available for withdrawal</span>,
      time: "Now",
    });
  }

  if (items.length === 0) return null;

  return (
    <GlassCard>
      <div className="p-4">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] ds-text-label">Recent Activity</p>
        <div className="flex flex-col" style={{ borderColor: "var(--ds-divider)" }}>
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, delay: i * 0.05, ease: "easeOut" }}
                layout
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                style={{ borderTop: i > 0 ? "1px solid var(--ds-divider)" : undefined }}
              >
                <div
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}28` }}
                >
                  {item.icon}
                </div>
                <p className="min-w-0 flex-1 text-[12px] ds-text-muted">{item.label}</p>
                <span className="shrink-0 text-[10px] font-semibold ds-text-faint">{item.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ArtistOverviewView({
  stats,
  recentReleases,
  demos = [],
  onNavigate,
  sessionUser,
}: ArtistOverviewViewProps) {
  const totalStreams =
    Number(stats.streams || 0) ||
    (Array.isArray(stats.trends)
      ? stats.trends.reduce((sum, p) => sum + (Number(p?.value) || 0), 0)
      : 0);
  const totalReleases = Number(stats.releases || 0);
  const totalTracks = Number(stats.songs || 0);
  const listeners = Number(stats.listeners || 0);
  const balance = Number(stats.balance || 0);
  const spotifyStreams = Number(stats.spotifyStreams || stats.streams || 0);
  const appleStreams = Number(stats.appleStreams || Math.floor((Number(stats.streams) || 0) * 0.45));

  const latestRelease = recentReleases[0] as Record<string, unknown> | undefined;
  const artworkSrc = resolveImageSrc(
    latestRelease?.image || stats.artistImage || sessionUser?.image,
    String(latestRelease?.id || ""),
  );
  const avatarSrc = resolveImageSrc(sessionUser?.image || stats.artistImage, "");

  const streamingStats = [
    { label: "Monthly Listeners", value: formatCompact(listeners), icon: <Headphones size={14} />, delta: listeners > 0 ? "-22.3%" : undefined, neg: true },
    { label: "Total Streams", value: formatCompact(totalStreams), icon: <Waves size={14} />, delta: totalStreams > 0 ? "-24.2%" : undefined, neg: true },
    { label: "Active Listeners", value: formatCompact(Math.round(listeners * 0.32)), icon: <BarChart3 size={14} />, delta: listeners > 0 ? "-8.8%" : undefined, neg: true },
    { label: "Spotify Streams", value: formatCompact(spotifyStreams), icon: <Music2 size={14} />, delta: spotifyStreams > 0 ? "-8.3%" : undefined, neg: true },
    { label: "Apple Music", value: formatCompact(appleStreams), icon: <Music2 size={14} />, delta: appleStreams > 0 ? "-6.4%" : undefined, neg: true },
    { label: "New Listeners", value: formatCompact(Math.round(listeners * 0.13)), icon: <Sparkles size={14} />, delta: listeners > 0 ? "-41.1%" : undefined, neg: true },
  ];

  return (
    <div className="flex flex-col gap-3">
      <FeaturedAnnouncements />

      {/* ── Profile Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Avatar */}
            <Badge.Anchor>
              <Avatar size="lg" className="h-14 w-14">
                <Avatar.Image src={avatarSrc} alt={sessionUser?.stageName || "Artist"} />
                <Avatar.Fallback>{(sessionUser?.stageName || "A")[0].toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <Badge color="success" placement="bottom-right" size="sm" />
            </Badge.Anchor>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-black leading-none ds-text tracking-tight">
                {sessionUser?.stageName || "Artist"}
              </h1>
              <p className="mt-0.5 text-[12px] ds-text-muted">{sessionUser?.email || ""}</p>
            </div>

            {/* Pill stats */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="ds-pill text-[11px]">
                <Waves size={11} />
                {formatCompact(listeners)} listeners
              </div>
              <div className="ds-pill text-[11px]">
                <Music2 size={11} />
                {totalReleases} releases · {totalTracks} tracks
              </div>
              {balance > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e44ccf]/30 bg-[#e44ccf]/8 px-3 py-1.5">
                  <Sparkles size={11} className="text-[#e44ccf]/80" />
                  <span className="text-[11px] font-bold text-[#e44ccf]/90">
                    ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} available
                  </span>
                </div>
              )}
              <button type="button" className="ds-btn-ghost" onClick={() => onNavigate("profile")}>
                <ArrowUpRight size={13} />
                Profile
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Bento Grid ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-3 lg:grid-cols-[260px_1fr]"
      >
        {/* Latest release artwork card */}
        <GlassCard className="flex flex-col gap-0">
          <div className="p-4 pb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] ds-text-label">Latest Release</p>
          </div>
          <div className="flex flex-col items-center gap-3 px-4">
            <div
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{ width: 180, height: 180, border: "1px solid var(--ds-glass-border)" }}
            >
              <NextImage
                src={artworkSrc}
                width={180}
                height={180}
                alt="Latest release"
                unoptimized
                onError={handleImageError}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-black ds-text leading-tight">
                {String(latestRelease?.name || "Latest Release")}
              </p>
              <p className="mt-1 text-[11px] ds-text-muted">
                {new Date(String(latestRelease?.releaseDate || latestRelease?.createdAt || Date.now())).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="p-4 pt-3">
            <button
              type="button"
              onClick={() => onNavigate("releases")}
              className="ds-btn-ghost w-full justify-center py-2 text-[11px]"
            >
              View all releases →
            </button>
          </div>
        </GlassCard>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* All-time streams + Quick actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Streams */}
            <GlassCard className="p-4">
              <p className="text-[11px] font-semibold ds-text-muted">All-time streams</p>
              <p className="mt-2 text-[42px] font-black leading-none ds-text">{formatCompact(totalStreams)}</p>
              <p className="mt-2 text-[11px] ds-text-faint">
                Last updated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </GlassCard>

            {/* Quick actions */}
            <GlassCard className="p-4">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] ds-text-label">Quick Actions</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate("submit")}
                  className="group ds-item flex items-center gap-2.5 p-3 text-left"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full ds-item ds-text-muted">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold ds-text">Open release flow</p>
                    <p className="text-[10px] ds-text-muted">Upload assets for your next drop</p>
                  </div>
                  <ChevronRight size={12} className="ds-text-faint transition-colors group-hover:ds-text-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("support")}
                  className="group ds-item flex items-center gap-2.5 p-3 text-left"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full ds-item ds-text-muted">
                    <Flame size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold ds-text">Contact support</p>
                    <p className="text-[10px] ds-text-muted">Catalog, payouts & contracts</p>
                  </div>
                  <ChevronRight size={12} className="ds-text-faint transition-colors" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Streaming stats grid */}
          <GlassCard className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[14px] font-black ds-text">Streaming Stats</p>
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>Last 28 days</Chip.Label>
              </Chip>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {streamingStats.map((stat) => (
                <div key={stat.label} className="group ds-item p-3.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-semibold ds-text-muted">{stat.label}</p>
                    <span className="ds-text-faint transition-colors">{stat.icon}</span>
                  </div>
                  <p className="mt-2 text-[18px] font-black leading-none ds-text">{stat.value}</p>
                  {stat.delta && (
                    <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black ${stat.neg ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {stat.neg ? <TrendingDown size={9} /> : <TrendingUp size={9} />}
                      {stat.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* ── Recent Releases + Demos ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className={`grid gap-3 ${demos.length > 0 ? "lg:grid-cols-2" : ""}`}
      >
        {/* Recent Releases */}
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] font-black ds-text">Recent Releases</p>
            <button type="button" onClick={() => onNavigate("releases")} className="ds-btn-ghost">
              Show all
            </button>
          </div>
          {recentReleases.length === 0 ? (
            <p className="text-[12px] ds-text-faint">No releases yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {recentReleases.slice(0, 4).map((release, i) => (
                <button
                  key={String(release.id || i)}
                  type="button"
                  onClick={() => onNavigate("releases")}
                  className="group ds-item flex items-center gap-3 p-3 text-left"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--ds-item-bg)" }}>
                    <NextImage
                      src={resolveImageSrc(release.image || stats.artistImage, String(release.id || ""))}
                      width={44}
                      height={44}
                      alt={String(release.name || "Release")}
                      unoptimized
                      onError={handleImageError}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-black ds-text">{String(release.name || "Untitled")}</p>
                    <p className="mt-0.5 text-[10px] ds-text-muted">{String(stats.artistName || "Artist")}</p>
                  </div>
                  <ChevronRight size={13} className="shrink-0 ds-text-faint transition-colors" />
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Demo submissions */}
        {demos.length > 0 && (
          <GlassCard className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-black ds-text">Demos</p>
                {(["pending", "reviewing", "approved", "rejected"] as const).map((s) => {
                  const count = demos.filter((d) => d.status === s).length;
                  if (count === 0) return null;
                  return (
                    <Chip key={s} size="sm" variant="soft" color={demoStatusColor(s)}>
                      <Chip.Label>{count} {s}</Chip.Label>
                    </Chip>
                  );
                })}
              </div>
              <button type="button" onClick={() => onNavigate("demos")} className="ds-btn-ghost">
                View all
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {demos.slice(0, 5).map((demo) => {
                const status = demo.status ?? "pending";
                const dotColor: Record<string, string> = {
                  pending: "rgba(156,163,175,0.7)",
                  reviewing: "#f59e0b",
                  approved: "#22c55e",
                  rejected: "#ef4444",
                };
                return (
                  <a
                    key={demo.id}
                    href={`/dashboard/demo/${demo.id}`}
                    className="group ds-item flex items-center gap-2.5 px-3 py-2.5 no-underline"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: dotColor[status] ?? dotColor.pending }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold ds-text-sub">
                      {String(demo.title ?? demo.name ?? "Untitled")}
                    </span>
                    <Chip size="sm" variant="soft" color={demoStatusColor(status)} className="shrink-0">
                      <Chip.Label>{status}</Chip.Label>
                    </Chip>
                  </a>
                );
              })}
            </div>
          </GlassCard>
        )}
      </motion.div>

      {/* ── Activity Feed ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <ActivityFeed demos={demos} recentReleases={recentReleases} stats={stats} />
      </motion.div>
    </div>
  );
}
