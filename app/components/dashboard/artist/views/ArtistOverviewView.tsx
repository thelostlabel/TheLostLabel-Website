"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import NextImage from "next/image";
import {
  Briefcase,
  ChevronRight,
  Disc,
  MessageSquare,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AppSessionUser } from "@/lib/auth-types";
import type { ArtistOverviewStats } from "@/app/components/dashboard/types";
import {
  DASHBOARD_THEME,
  handleImageError,
  resolveImageSrc,
} from "@/app/components/dashboard/artist/lib/shared";

type ArtistOverviewViewProps = {
  stats: ArtistOverviewStats;
  recentReleases: Array<Record<string, unknown>>;
  onNavigate: (view: string) => void;
  sessionUser: AppSessionUser | null;
};

type ArtistQuickAccessBarProps = {
  stats: ArtistOverviewStats;
  currentView: string;
  onNavigate: (view: string) => void;
};

const ChartTooltip = ({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean;
  payload?: Array<{ color?: string; value?: number; payload?: { value?: number } }>;
  label?: string;
  color?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#000",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        padding: "12px 16px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#a8b0bc",
          fontWeight: 800,
          letterSpacing: "0.5px",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      {payload.map((entry, index) => (
        <div
          key={index}
          style={{
            fontSize: "13px",
            fontWeight: 900,
            color: entry.color || color || "#fff",
          }}
        >
          {Number(entry.value || 0).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function RechartsAreaChart({
  data,
  color = "#D1D5DB",
  height = 260,
}: {
  data?: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}) {
  const sanitizedData = Array.isArray(data)
    ? data.filter((point) => point && Number.isFinite(Number(point.value)))
    : [];
  const hasSignal = sanitizedData.some((point) => Number(point.value) > 0);

  if (sanitizedData.length === 0 || !hasSignal) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: "11px",
          letterSpacing: "2px",
          fontWeight: 800,
        }}
      >
        No activity in the selected range
      </div>
    );
  }

  if (sanitizedData.length === 1) {
    const point = sanitizedData[0];

    return (
      <div
        style={{
          width: "100%",
          height: `${height}px`,
          marginTop: "10px",
          borderRadius: "16px",
          border: "1px dashed rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.015)",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "1.6px",
              color: "#99a5b6",
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            Single Data Point
          </div>
          <div style={{ fontSize: "34px", fontWeight: 900, color }}>
            {Number(point.value).toLocaleString()}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#b2bac6",
              fontWeight: 800,
              marginTop: "8px",
            }}
          >
            {point.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        marginTop: "10px",
        minWidth: 0,
        minHeight: `${height}px`,
      }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <AreaChart data={sanitizedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient
              id={`artist-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.03)"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#444", fontSize: 9, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#444", fontSize: 9, fontWeight: 700 }}
            tickFormatter={(value: number) => {
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
              if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
              return String(value);
            }}
          />
          <Tooltip content={<ChartTooltip color={color} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill={`url(#artist-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
            dot={{ r: 2, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, stroke: "#000", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ArtistQuickAccessBar({
  stats,
  currentView,
  onNavigate,
}: ArtistQuickAccessBarProps) {
  const available = stats.available ?? stats.balance ?? 0;
  const pending = stats.pending ?? 0;
  const paid = stats.paid ?? 0;

  const cardStyle = {
    padding: "14px",
    background: DASHBOARD_THEME.surface,
    border: `1px solid ${DASHBOARD_THEME.border}`,
    borderRadius: "10px",
    minHeight: "84px",
    position: "relative" as const,
    overflow: "hidden" as const,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    cursor: "pointer",
  };

  const labelStyle = {
    fontSize: "11px",
    color: DASHBOARD_THEME.muted,
    fontWeight: 800,
    letterSpacing: "0.7px",
    marginBottom: "6px",
    zIndex: 2,
    position: "relative" as const,
  };

  const valueStyle = {
    fontSize: "21px",
    color: DASHBOARD_THEME.text,
    fontWeight: 900,
    letterSpacing: "-0.4px",
    zIndex: 2,
    position: "relative" as const,
  };

  const navButtonStyle = {
    minHeight: "34px",
    borderRadius: "999px",
    width: "auto",
    padding: "0 12px",
    fontSize: "11px",
    letterSpacing: "0.6px",
    background: "rgba(255,255,255,0.015)",
    border: `1px solid ${DASHBOARD_THEME.border}`,
    color: DASHBOARD_THEME.text,
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  return (
    <div
      className="quick-access-root"
      style={{
        marginBottom: "18px",
        display: "grid",
        gap: "10px",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      }}
    >
      {[
        {
          label: "Available",
          value: `$${Number(available).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`,
          onClick: () => onNavigate("earnings"),
          valueColor: DASHBOARD_THEME.accentHover,
        },
        {
          label: "Pending",
          value: `$${Number(pending).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`,
          onClick: () => onNavigate("earnings"),
        },
        {
          label: "Paid",
          value: `$${Number(paid).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`,
          onClick: () => onNavigate("earnings"),
        },
        {
          label: "Monthly Listeners",
          value: Number(stats.listeners || 0).toLocaleString(),
          onClick: () => onNavigate("overview"),
        },
      ].map((item) => (
        <motion.button
          key={item.label}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={item.onClick}
          className="quick-access-card"
          style={cardStyle}
        >
          <div style={labelStyle}>{item.label}</div>
          <div style={{ ...valueStyle, color: item.valueColor || DASHBOARD_THEME.text }}>
            {item.value}
          </div>
        </motion.button>
      ))}

      <div className="quick-nav-grid">
        {[
          { view: "submit", label: "Submit", icon: <Upload size={13} /> },
          { view: "contracts", label: "Contracts", icon: <Briefcase size={13} /> },
          { view: "support", label: "Support", icon: <MessageSquare size={13} /> },
          { view: "releases", label: "Catalog", icon: <Disc size={13} /> },
        ].map((item) => {
          const isActive = currentView === item.view;
          return (
            <motion.button
              key={item.view}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              onClick={() => onNavigate(item.view)}
              className="quick-nav-btn"
              style={{
                ...navButtonStyle,
                background: isActive ? DASHBOARD_THEME.accent : "rgba(255,255,255,0.015)",
                color: isActive ? "#0b0914" : DASHBOARD_THEME.text,
                border: isActive ? "none" : navButtonStyle.border,
              }}
            >
              {item.icon}
              {item.label}
            </motion.button>
          );
        })}
      </div>

      <style jsx>{`
        .quick-nav-grid {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 2px;
        }
        @media (max-width: 640px) {
          .quick-access-root {
            grid-template-columns: 1fr 1fr !important;
          }
          .quick-nav-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }
          .quick-nav-btn {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ArtistOverviewView({
  stats,
  recentReleases,
  onNavigate,
  sessionUser,
}: ArtistOverviewViewProps) {
  const [chartRange, setChartRange] = useState("90D");
  const rangeSize = useMemo(() => {
    const map: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90, "180D": 180 };
    return map[chartRange] || 90;
  }, [chartRange]);

  const totalReleases = stats.releases || 0;
  const totalTracks = Number(stats.songs || 0);
  const totalStreams =
    Number(stats.streams || 0) ||
    (Array.isArray(stats.trends)
      ? stats.trends.reduce((sum, point) => sum + (Number(point?.value) || 0), 0)
      : 0);

  const listenerTrend = useMemo(
    () => (Array.isArray(stats.listenerTrend) ? stats.listenerTrend.slice(-rangeSize) : []),
    [rangeSize, stats.listenerTrend],
  );
  const streamTrend = useMemo(
    () => (Array.isArray(stats.trends) ? stats.trends.slice(-rangeSize) : []),
    [rangeSize, stats.trends],
  );
  const platformBreakdown = useMemo(() => {
    const spotifyStreams = Number(stats.spotifyStreams || stats.streams || 0);
    const appleStreams = Number(
      stats.appleStreams || Math.floor((Number(stats.streams) || 0) * 0.45),
    );
    const total = spotifyStreams + appleStreams;

    return [
      {
        name: "Spotify",
        value: spotifyStreams,
        color: "#1DB954",
        percent: total > 0 ? (spotifyStreams / total) * 100 : 0,
      },
      {
        name: "Apple Music",
        value: appleStreams,
        color: "#FA2D48",
        percent: total > 0 ? (appleStreams / total) * 100 : 0,
      },
    ];
  }, [stats.appleStreams, stats.spotifyStreams, stats.streams]);

  return (
    <div className="overview-root" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        className="overview-kpi-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}
      >
        {[
          { label: "Total Releases", value: totalReleases },
          { label: "Total Tracks", value: totalTracks },
          { label: "Total Streams", value: totalStreams },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="overview-kpi-card"
            style={{
              padding: "16px 18px",
              background: DASHBOARD_THEME.surface,
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
              }}
            />
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "1px" }}>
              {card.label}
            </p>
            <p style={{ fontSize: "21px", fontWeight: 900, color: DASHBOARD_THEME.accent, margin: 0 }}>
              {(card.value || 0).toLocaleString()}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", fontWeight: 600 }}>
                Updated now
              </span>
              <TrendingUp size={13} color="rgba(255,255,255,0.15)" />
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="overview-main-grid"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "start" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overview-welcome"
            style={{
              background: "linear-gradient(130deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              minHeight: "156px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="overview-welcome-main" style={{ display: "flex", alignItems: "center", gap: "18px", zIndex: 1 }}>
              <div
                className="overview-welcome-avatar"
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.25)",
                }}
              >
                <NextImage
                  src={resolveImageSrc(sessionUser?.image)}
                  width={90}
                  height={90}
                  alt="Artist avatar"
                  unoptimized
                  onError={handleImageError}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h1 className="overview-welcome-title" style={{ fontSize: "24px", fontWeight: 900, color: "#fff", margin: 0 }}>
                  Welcome, {sessionUser?.stageName || "Artist"}
                </h1>
                <p style={{ marginTop: "6px", fontSize: "11px", color: "#9ca3af", fontWeight: 700 }}>
                  Artist dashboard overview
                </p>
              </div>
            </div>
            <div className="overview-balance-panel" style={{ textAlign: "right", zIndex: 1 }}>
              <p className="overview-balance-value" style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: 0 }}>
                ${(stats.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 800, marginTop: "4px" }}>
                Balance available
              </p>
              <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 700, marginTop: "8px" }}>
                Monthly listeners: {Number(stats.listeners || 0).toLocaleString()}
              </p>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.09), transparent 42%)",
              }}
            />
          </motion.div>

          <div className="overview-action-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { title: "Create Release", desc: "Add a release to your catalog", icon: <Disc size={20} />, action: () => onNavigate("submit") },
              { title: "Support", desc: "Open a request and talk with admin", icon: <MessageSquare size={20} />, action: () => onNavigate("support") },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                className="overview-action-card"
                onClick={item.action}
                style={{
                  padding: "18px",
                  background: DASHBOARD_THEME.surface,
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", display: "grid", placeItems: "center", color: DASHBOARD_THEME.muted }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", margin: 0 }}>{item.title}</h4>
                  <p style={{ fontSize: "11px", color: DASHBOARD_THEME.muted, marginTop: "2px" }}>{item.desc}</p>
                </div>
                <ChevronRight size={18} color={DASHBOARD_THEME.accent} />
              </motion.div>
            ))}
          </div>

          <div className="overview-release-card" style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "16px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "1px", margin: 0 }}>
                Recent Releases
              </h3>
              <button onClick={() => onNavigate("releases")} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontSize: "10px", padding: "6px 12px", borderRadius: "6px", fontWeight: 900, cursor: "pointer" }}>
                Show all
              </button>
            </div>
            <div className="overview-release-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
              {recentReleases.length === 0 ? (
                <p style={{ color: DASHBOARD_THEME.muted, fontSize: "11px" }}>No releases found.</p>
              ) : (
                recentReleases.slice(0, 4).map((release, index) => (
                  <div key={String(release.id || index)} onClick={() => onNavigate("releases")} style={{ cursor: "pointer" }}>
                    <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", background: "#000", marginBottom: "8px", border: `1px solid ${DASHBOARD_THEME.border}` }}>
                      <NextImage
                        src={resolveImageSrc(release.image || stats.artistImage, String(release.id || ""))}
                        width={200}
                        height={200}
                        alt={String(release.name || "Release")}
                        unoptimized
                        onError={handleImageError}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {String(release.name || "Untitled release")}
                    </p>
                    <p style={{ fontSize: "10px", color: DASHBOARD_THEME.muted, marginTop: "2px" }}>
                      {String(stats.artistName || "Artist")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="overview-right-card" style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="overview-range-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: 0 }}>Monthly listeners</h4>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0 0" }}>
                  {Number(stats.listeners || 0).toLocaleString()} current
                </p>
              </div>
              <div className="overview-range-group" style={{ display: "flex", gap: "6px" }}>
                {["7D", "30D", "90D", "180D"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setChartRange(range)}
                    style={{
                      border: `1px solid ${range === chartRange ? "#d1d5db" : DASHBOARD_THEME.border}`,
                      background: range === chartRange ? "#d1d5db" : "rgba(255,255,255,0.03)",
                      color: range === chartRange ? "#0b0b0b" : "#d1d5db",
                      fontSize: "10px",
                      fontWeight: 800,
                      borderRadius: "999px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: "156px", width: "100%" }}>
              <RechartsAreaChart data={listenerTrend} color={DASHBOARD_THEME.accent} height={156} />
            </div>
          </div>

          <div className="overview-right-card" style={{ background: DASHBOARD_THEME.surface, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "16px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: 0 }}>Total streams</h4>
                <p style={{ fontSize: "11px", color: DASHBOARD_THEME.muted, marginTop: "4px" }}>
                  Last 6 months
                </p>
              </div>
              <button onClick={() => onNavigate("earnings")} style={{ background: "none", border: "none", color: DASHBOARD_THEME.accent, fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                See details &gt;
              </button>
            </div>

            <div style={{ height: "126px", width: "100%", position: "relative", margin: "14px 0" }}>
              <RechartsAreaChart data={streamTrend} color={DASHBOARD_THEME.accent} height={126} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {platformBreakdown.map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{item.name}</span>
                    <div style={{ height: "6px", flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(4, Math.round(item.percent))}%`, background: item.color, height: "100%" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>
                    {Number(item.value || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1180px) {
          .overview-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          .overview-release-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .overview-kpi-grid,
          .overview-action-grid,
          .overview-release-grid {
            grid-template-columns: 1fr !important;
          }
          .overview-welcome {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .overview-balance-panel {
            width: 100%;
            text-align: left !important;
          }
          .overview-range-head {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px;
          }
          .overview-range-group {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
