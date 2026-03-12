"use client";

import { motion } from "framer-motion";

import type { AppSessionUser } from "@/lib/auth-types";
import type {
  ArtistOverviewStats,
  DashboardEarning,
  DashboardPagination,
  DashboardPayment,
} from "@/app/components/dashboard/types";
import {
  DASHBOARD_THEME,
  btnStyle,
  glassStyle,
} from "@/app/components/dashboard/artist/lib/shared";

type ArtistEarningsViewProps = {
  earnings: DashboardEarning[];
  payments: DashboardPayment[];
  sessionUser: AppSessionUser | null;
  pagination: DashboardPagination;
  onPageChange: (page: number) => void;
  stats: ArtistOverviewStats;
  onWithdrawClick: () => void;
};

const tableHeadStyle = {
  padding: "20px 25px",
  fontSize: "12px",
  letterSpacing: "1px",
  color: DASHBOARD_THEME.muted,
  fontWeight: 900,
  borderBottom: `1px solid ${DASHBOARD_THEME.border}`,
  background: DASHBOARD_THEME.surface,
  textTransform: "uppercase" as const,
};

const tableCellStyle = {
  padding: "18px 25px",
  fontSize: "12px",
  color: DASHBOARD_THEME.muted,
  borderBottom: "1px solid rgba(255,255,255,0.02)",
  fontWeight: 700,
};

export default function ArtistEarningsView({
  earnings,
  payments,
  sessionUser,
  pagination,
  onPageChange,
  stats,
  onWithdrawClick,
}: ArtistEarningsViewProps) {
  const currentArtistId = (
    sessionUser as (AppSessionUser & { artist?: { id?: string } }) | null
  )?.artist?.id;

  const calculateUserShare = (earning: DashboardEarning) => {
    if (!earning.contract?.splits || earning.contract.splits.length === 0) {
      return Number(earning.artistAmount || 0);
    }

    const userSplits = earning.contract.splits.filter((split) =>
      split.userId === sessionUser?.id ||
      (split.artistId && currentArtistId === split.artistId) ||
      (split.user?.email && split.user.email === sessionUser?.email) ||
      (split.name &&
        [sessionUser?.email, sessionUser?.stageName, sessionUser?.name]
          .filter(Boolean)
          .some((value) => split.name?.toLowerCase() === value?.toLowerCase())),
    );

    if (userSplits.length > 0) {
      const totalUserSplitPercentage = userSplits.reduce(
        (sum, split) => sum + Number.parseFloat(String(split.percentage || 0)),
        0,
      );
      return (Number(earning.artistAmount || 0) * totalUserSplitPercentage) / 100;
    }

    return 0;
  };

  const totalSpend = earnings.reduce((sum, earning) => sum + Number(earning.expenseAmount || 0), 0);
  const totalLabel = earnings.reduce((sum, earning) => sum + Number(earning.labelAmount || 0), 0);

  const spendByRelease = Object.values(
    earnings.reduce<Record<string, { name: string; spend: number; revenue: number }>>(
      (accumulator, earning) => {
        const key = String(earning.contract?.release?.name || "Unknown");
        accumulator[key] = accumulator[key] || { name: key, spend: 0, revenue: 0 };
        accumulator[key].spend += Number(earning.expenseAmount || 0);
        accumulator[key].revenue += Number(earning.labelAmount || 0);
        return accumulator;
      },
      {},
    ),
  )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 4);

  const spendBySource = Object.values(
    earnings.reduce<Record<string, { source: string; spend: number; streams: number }>>(
      (accumulator, earning) => {
        const key = String(earning.source || "OTHER").toUpperCase();
        accumulator[key] = accumulator[key] || { source: key, spend: 0, streams: 0 };
        accumulator[key].spend += Number(earning.expenseAmount || 0);
        accumulator[key].streams += Number(earning.streams || 0);
        return accumulator;
      },
      {},
    ),
  )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const earningsTone = {
    shellGlowA: "rgba(209,213,219,0.06)",
    shellGlowB: "rgba(156,163,175,0.06)",
    panel: "rgba(255,255,255,0.03)",
    panelSoft: "rgba(255,255,255,0.05)",
    panelBorder: "rgba(255,255,255,0.08)",
    muted: "#888888",
    accent: "#D1D5DB",
    info: "#60A5FA",
  };

  const panelStyle = {
    background: `linear-gradient(160deg, ${earningsTone.panelSoft}, ${earningsTone.panel})`,
    border: `1px solid ${earningsTone.panelBorder}`,
    borderRadius: "12px",
  };

  return (
    <div
      style={{
        background: `radial-gradient(900px 340px at 15% -10%, ${earningsTone.shellGlowA}, transparent 50%), radial-gradient(900px 340px at 90% -20%, ${earningsTone.shellGlowB}, transparent 56%)`,
        borderRadius: "10px",
        padding: "2px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ ...panelStyle, padding: "30px", position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
        >
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "150px",
              height: "150px",
              background: `radial-gradient(circle, ${earningsTone.accent} 0%, transparent 72%)`,
              opacity: 0.1,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 900, letterSpacing: "1px", marginBottom: "15px", position: "relative", zIndex: 2 }}>
            Available Balance
          </div>
          <div style={{ fontSize: "42px", fontWeight: 950, color: "#fff", letterSpacing: "-1.5px", marginBottom: "25px", position: "relative", zIndex: 2 }}>
            ${(stats.available ?? stats.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <button
            onClick={onWithdrawClick}
            style={{ ...btnStyle, background: earningsTone.accent, color: "#120c22", border: "none", padding: "12px 25px", width: "100%", position: "relative", zIndex: 2 }}
          >
            Withdraw funds
          </button>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {[
            { label: "Total Earnings", value: Number(stats.earnings || 0), accent: "rgba(34, 197, 94, 0.35)" },
            { label: "Paid", value: Number(stats.paid ?? stats.withdrawn ?? 0), accent: "rgba(56,189,248,0.35)" },
            { label: "Pending", value: Number(stats.pending || 0), accent: "rgba(245, 158, 11, 0.35)" },
            { label: "Label ROI", value: totalSpend > 0 ? `${(totalLabel / totalSpend).toFixed(1)}x` : "—", accent: totalSpend > 0 ? "rgba(56,189,248,0.35)" : "rgba(255, 255, 255, 0.1)" },
          ].map((item) => (
            <motion.div key={item.label} whileHover={{ y: -2 }} style={{ ...panelStyle, padding: "25px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 900, letterSpacing: "0.6px", marginBottom: "8px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff" }}>
                {typeof item.value === "number"
                  ? `$${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : item.value}
              </div>
              <div style={{ width: "100%", height: "2px", background: item.accent, marginTop: "12px", borderRadius: "2px" }} />
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {[{ title: "Top Releases by Ad Spend", items: spendByRelease, type: "release" }, { title: "Spend by Source", items: spendBySource, type: "source" }].map((block) => (
          <motion.div key={block.title} whileHover={{ y: -2 }} style={{ ...panelStyle, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "12px", letterSpacing: "1px", fontWeight: 900, margin: 0, color: earningsTone.muted }}>
                {block.title}
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {block.type === "release"
                ? spendByRelease.map((item) => {
                    const pct = totalSpend ? Math.round((item.spend / totalSpend) * 100) : 0;
                    return (
                      <div key={item.name} style={{ padding: "16px", background: earningsTone.panelSoft, borderRadius: "10px", border: `1px solid ${earningsTone.panelBorder}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ color: "#fff", fontWeight: 900, fontSize: "13px" }}>{item.name}</div>
                          <div style={{ color: earningsTone.info, fontWeight: 900, fontSize: "13px" }}>${item.spend.toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 800, marginBottom: "10px" }}>
                          Label revenue: ${item.revenue.toLocaleString()} • {pct}% of spend
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: "100%", background: earningsTone.info }} />
                        </div>
                      </div>
                    );
                  })
                : spendBySource.map((item) => {
                    const pct = totalSpend ? Math.round((item.spend / totalSpend) * 100) : 0;
                    return (
                      <div key={item.source} style={{ display: "grid", gridTemplateColumns: "1fr 70px 40px", gap: "8px", alignItems: "center", padding: "12px 16px", background: earningsTone.panelSoft, border: `1px solid ${earningsTone.panelBorder}`, borderRadius: "10px" }}>
                        <div style={{ color: "#fff", fontWeight: 900, fontSize: "12px" }}>{item.source}</div>
                        <div style={{ color: earningsTone.info, fontWeight: 900, textAlign: "right", fontSize: "12px" }}>
                          ${item.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 800, textAlign: "right" }}>{pct}%</div>
                        <div style={{ gridColumn: "1 / 4", width: "100%", height: "5px", background: "rgba(255,255,255,0.04)", borderRadius: "999px", overflow: "hidden", marginTop: "4px" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: "100%", background: earningsTone.info }} />
                        </div>
                      </div>
                    );
                  })}
              {block.items.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: earningsTone.muted, fontSize: "12px", letterSpacing: "1px", fontWeight: 900 }}>
                  No spend data
                </div>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={{ ...glassStyle, background: panelStyle.background, border: panelStyle.border }}>
          <div style={{ padding: "20px 25px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: 950, margin: 0 }}>
              Revenue Share History
            </h3>
            <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 800 }}>
              {earnings.length} records
            </div>
          </div>
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Period</th>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Release</th>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Your Share</th>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning) => {
                  const userShare = calculateUserShare(earning);
                  const userSplit = earning.contract?.splits?.find((split) => split.userId === sessionUser?.id);

                  return (
                    <tr key={earning.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      <td style={{ ...tableCellStyle, padding: "12px 25px" }}>{earning.period}</td>
                      <td style={{ ...tableCellStyle, padding: "12px 25px" }}>
                        <div style={{ fontWeight: 850, color: "#fff", fontSize: "11px" }}>
                          {earning.contract?.release?.name || earning.contract?.title || "Unknown release"}
                        </div>
                        <div style={{ fontSize: "12px", color: earningsTone.muted, textTransform: "uppercase" }}>
                          {earning.source}
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, padding: "12px 25px" }}>
                        <div style={{ color: earningsTone.info, fontWeight: 950 }}>
                          ${userShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: "12px", color: earningsTone.muted }}>
                          {userSplit ? `${userSplit.percentage}% split` : "Owner"}
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, padding: "12px 25px" }}>
                        <span style={{ fontSize: "8px", padding: "3px 8px", borderRadius: "4px", background: earning.paidToArtist ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: earning.paidToArtist ? DASHBOARD_THEME.success : earningsTone.muted, border: `1px solid ${earning.paidToArtist ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`, fontWeight: 950 }}>
                          {earning.paidToArtist ? "Processed" : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...glassStyle, background: panelStyle.background, border: panelStyle.border }}>
          <div style={{ padding: "20px 25px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: 950, margin: 0 }}>
              Payout Log
            </h3>
            <div style={{ fontSize: "12px", color: earningsTone.muted, fontWeight: 800 }}>
              {payments.length} records
            </div>
          </div>
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Date</th>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Amount</th>
                  <th style={{ ...tableHeadStyle, padding: "12px 25px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ ...tableCellStyle, padding: "12px 25px" }}>
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ ...tableCellStyle, padding: "12px 25px", fontWeight: 950, color: "#fff" }}>
                      ${Number(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...tableCellStyle, padding: "12px 25px" }}>
                      <span style={{ fontSize: "8px", padding: "3px 8px", borderRadius: "4px", background: payment.status === "completed" ? "rgba(34,197,94,0.1)" : payment.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: payment.status === "completed" ? DASHBOARD_THEME.success : payment.status === "pending" ? DASHBOARD_THEME.warning : DASHBOARD_THEME.error, border: `1px solid ${payment.status === "completed" ? "rgba(34,197,94,0.3)" : payment.status === "pending" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`, fontWeight: 950 }}>
                        {String(payment.status || "pending").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ ...tableCellStyle, textAlign: "center", padding: "40px", color: earningsTone.muted }}>
                      No payout history
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pagination.pages > 1 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "20px" }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            style={{ ...btnStyle, background: earningsTone.panelSoft, color: pagination.page <= 1 ? earningsTone.muted : "#fff", cursor: pagination.page <= 1 ? "not-allowed" : "pointer" }}
          >
            Previous
          </button>
          <span style={{ fontSize: "12px", fontWeight: 800, color: earningsTone.muted, letterSpacing: "1px" }}>
            Page <span style={{ color: "#fff" }}>{pagination.page}</span> of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
            style={{ ...btnStyle, background: earningsTone.panelSoft, color: pagination.page >= pagination.pages ? earningsTone.muted : "#fff", cursor: pagination.page >= pagination.pages ? "not-allowed" : "pointer" }}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
