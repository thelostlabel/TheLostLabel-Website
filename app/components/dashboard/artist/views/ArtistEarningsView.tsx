"use client";

import type { FormEvent } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Chip, Dropdown, Input, Label, Pagination, ProgressBar, Table, TextArea, TextField } from "@heroui/react";
import {
  ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Area, BarChart, Bar,
} from "recharts";
import { useChartPalette, useChartGradientId, ChartTooltip } from "@/app/components/dashboard/lib/ChartPrimitives";

import type { AppSessionUser } from "@/lib/auth-types";
import type {
  ArtistOverviewStats,
  DashboardEarning,
  DashboardPagination,
  DashboardPayment,
} from "@/app/components/dashboard/types";

const INPUT_CLASS = "dash-input";

const PAYMENT_METHODS = [
  { id: "BANK_TRANSFER", label: "Bank Transfer (IBAN)" },
  { id: "PAYPAL",        label: "PayPal" },
  { id: "CRYPTO",        label: "Crypto (USDT/BTC)" },
  { id: "WISE",          label: "Wise" },
];

type WithdrawalState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  amount: string;
  setAmount: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  wiseEmail: string;
  setWiseEmail: (v: string) => void;
  submitting: boolean;
  handleSubmit: (event: FormEvent) => Promise<void>;
};

type ArtistEarningsViewProps = {
  earnings: DashboardEarning[];
  payments: DashboardPayment[];
  sessionUser: AppSessionUser | null;
  pagination: DashboardPagination;
  onPageChange: (page: number) => void;
  stats: ArtistOverviewStats;
  withdrawal: WithdrawalState;
};

const paymentStatusColor = (
  status: string,
): "default" | "success" | "warning" | "danger" => {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "default";
};

export default function ArtistEarningsView({
  earnings,
  payments,
  sessionUser,
  pagination,
  onPageChange,
  stats,
  withdrawal,
}: ArtistEarningsViewProps) {
  const c = useChartPalette();
  const earningsGradId = useChartGradientId('earnings');
  const projectedGradId = useChartGradientId('projected');

  const formatCurrency = (value: number) =>
    `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const currentArtistId = (
    sessionUser as (AppSessionUser & { artist?: { id?: string } }) | null
  )?.artist?.id;

  const calculateUserShare = (earning: DashboardEarning) => {
    if (!earning.contract?.splits || earning.contract.splits.length === 0) {
      return Number(earning.artistAmount || 0);
    }
    const userSplits = earning.contract.splits.filter(
      (split) =>
        split.userId === sessionUser?.id ||
        (split.artistId && currentArtistId === split.artistId) ||
        (split.user?.email && split.user.email === sessionUser?.email) ||
        (split.name &&
          [sessionUser?.email, sessionUser?.stageName, sessionUser?.name]
            .filter(Boolean)
            .some((v) => split.name?.toLowerCase() === v?.toLowerCase())),
    );
    if (userSplits.length > 0) {
      const pct = userSplits.reduce(
        (sum, s) => sum + Number.parseFloat(String(s.percentage || 0)),
        0,
      );
      return (Number(earning.artistAmount || 0) * pct) / 100;
    }
    return 0;
  };

  const availableBalance = Number(stats.available ?? stats.balance ?? 0);
  const lifetimeEarnings = Number(stats.earnings || 0);
  const paidOut = Number(stats.paid ?? stats.withdrawn ?? 0);
  const pendingPayouts = Number(stats.pending || 0);
  const totalStatements = pagination.total || earnings.length;
  const averageStatementValue = totalStatements > 0 ? lifetimeEarnings / totalStatements : 0;
  const displayedShareTotal = earnings.reduce(
    (sum, earning) => sum + calculateUserShare(earning),
    0,
  );
  const latestPeriod = earnings[0]?.period || null;
  const completedPayoutCount = payments.filter((payment) => payment.status === "completed").length;

  const earningsByRelease = Object.values(
    earnings.reduce<Record<string, { name: string; amount: number; records: number; unpaid: number }>>(
      (acc, e) => {
        const key = String(e.contract?.release?.name || "Unknown");
        acc[key] = acc[key] || { name: key, amount: 0, records: 0, unpaid: 0 };
        acc[key].amount += calculateUserShare(e);
        acc[key].records += 1;
        acc[key].unpaid += e.paidToArtist ? 0 : 1;
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const earningsBySource = Object.values(
    earnings.reduce<Record<string, { source: string; amount: number; streams: number; records: number }>>(
      (acc, e) => {
        const key = String(e.source || "OTHER").toUpperCase();
        acc[key] = acc[key] || { source: key, amount: 0, streams: 0, records: 0 };
        acc[key].amount += calculateUserShare(e);
        acc[key].streams += Number(e.streams || 0);
        acc[key].records += 1;
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const summaryStats = [
    {
      label: "Lifetime Earnings",
      value: formatCurrency(lifetimeEarnings),
      note: `${totalStatements} statements tracked`,
      color: "success" as const,
    },
    {
      label: "Paid Out",
      value: formatCurrency(paidOut),
      note: completedPayoutCount > 0 ? `${completedPayoutCount} completed payouts` : "No completed payouts yet",
      color: "accent" as const,
    },
    {
      label: "Pending Payouts",
      value: formatCurrency(pendingPayouts),
      note: pendingPayouts > 0 ? "Awaiting review or processing" : "Nothing waiting in queue",
      color: "warning" as const,
    },
    {
      label: "Average Statement",
      value: totalStatements > 0 ? formatCurrency(averageStatementValue) : "—",
      note: latestPeriod ? `Latest period ${latestPeriod}` : "No earning statements yet",
      color: "default" as const,
    },
  ];

  // ── Monthly earnings trend data for chart ──
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, { month: string; earnings: number; streams: number }>();
    for (const e of earnings) {
      const period = e.period || "";
      // period is typically "YYYY-MM" or similar
      const key = period.slice(0, 7) || "Unknown";
      const entry = monthMap.get(key) || { month: key, earnings: 0, streams: 0 };
      entry.earnings += calculateUserShare(e);
      entry.streams += Number(e.streams || 0);
      monthMap.set(key, entry);
    }
    return Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        label: item.month.length >= 7
          ? new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : item.month,
      }));
  }, [earnings]);

  // ── Revenue projection (simple linear trend) ──
  const projectedEarnings = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const recent = monthlyTrend.slice(-3);
    const avg = recent.reduce((s, m) => s + m.earnings, 0) / recent.length;
    const lastMonth = monthlyTrend[monthlyTrend.length - 1];
    const lastDate = new Date(lastMonth.month + "-01");
    const projections = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      projections.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        earnings: 0,
        projected: Math.round(avg * 100) / 100,
        streams: 0,
      });
    }
    return projections;
  }, [monthlyTrend]);

  const chartData = useMemo(() => {
    const actual = monthlyTrend.map((m) => ({ ...m, projected: undefined as number | undefined }));
    if (!projectedEarnings) return actual;
    // bridge: last actual point also gets projected value
    if (actual.length > 0) {
      actual[actual.length - 1].projected = actual[actual.length - 1].earnings;
    }
    return [...actual, ...projectedEarnings];
  }, [monthlyTrend, projectedEarnings]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top: Balance + Summary stats ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 lg:grid-cols-[280px_1fr]"
      >
        {/* Available Balance */}
        <Card variant="secondary" className="relative overflow-hidden border-default/8">
          <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-default/5 blur-2xl" />
          <Card.Header className="gap-1">
            <Card.Title className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
              Available Balance
            </Card.Title>
            <Card.Description className="text-[12px] leading-relaxed text-foreground/45">
              Ready to withdraw after pending payout requests are reserved from your total earnings.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4 pb-5">
            <p className="text-[40px] font-black leading-none tracking-tight text-foreground">
              {formatCurrency(availableBalance)}
            </p>

            <Button
              variant={withdrawal.isOpen ? "tertiary" : "primary"}
              className="w-full"
              onPress={withdrawal.isOpen ? withdrawal.close : withdrawal.open}
            >
              {withdrawal.isOpen ? "Cancel" : "Request Withdrawal"}
            </Button>

            <AnimatePresence>
              {withdrawal.isOpen && (
                <motion.div
                  key="withdraw-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={withdrawal.handleSubmit}
                    className="flex flex-col gap-4 pt-1 border-t border-default/10"
                  >
                    <div className="flex flex-col gap-4 pt-4">
                      {/* Amount */}
                      <TextField fullWidth type="number" value={withdrawal.amount} onChange={withdrawal.setAmount}>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Amount (USD)</Label>
                        <Input placeholder="0.00" className={INPUT_CLASS} variant="secondary" />
                      </TextField>

                      {/* Payment Method */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Payment Method</Label>
                        <Dropdown>
                          <Button variant="secondary" size="md" className="w-full justify-between text-[12px] font-semibold">
                            {PAYMENT_METHODS.find(m => m.id === withdrawal.method)?.label ?? withdrawal.method}
                          </Button>
                          <Dropdown.Popover>
                            <Dropdown.Menu
                              selectionMode="single"
                              selectedKeys={new Set([withdrawal.method])}
                              onSelectionChange={(keys) => withdrawal.setMethod(Array.from(keys)[0] as string)}
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <Dropdown.Item key={m.id} id={m.id} textValue={m.label}>
                                  <Label className="cursor-pointer text-[12px]">{m.label}</Label>
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </div>

                      {/* Wise-specific email field */}
                      {withdrawal.method === "WISE" && (
                        <TextField fullWidth type="email" value={withdrawal.wiseEmail} onChange={withdrawal.setWiseEmail} isRequired>
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Wise Account Email *</Label>
                          <Input placeholder="your@wise.com" className={INPUT_CLASS} variant="secondary" />
                        </TextField>
                      )}

                      {/* Notes */}
                      <TextField fullWidth value={withdrawal.notes} onChange={withdrawal.setNotes}>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted">
                          {withdrawal.method === "WISE"
                            ? "Additional Notes (optional)"
                            : "Payment Details / Notes"}
                        </Label>
                        <TextArea
                          placeholder={
                            withdrawal.method === "WISE"
                              ? "Optional: any extra details for the label..."
                              : "IBAN, email, wallet address, or other payout details"
                          }
                          className={`${INPUT_CLASS} min-h-[80px] resize-none`}
                          variant="secondary"
                        />
                      </TextField>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      isDisabled={withdrawal.submitting}
                    >
                      {withdrawal.submitting ? "Processing..." : "Submit Request"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Card.Content>
        </Card>

        {/* 2×2 stat grid */}
        <div className="grid grid-cols-2 gap-4">
          {summaryStats.map((item) => (
            <motion.div key={item.label} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card variant="default" className="h-full border-default/6">
                <Card.Header className="gap-1">
                  <Card.Title className="text-[11px] font-black uppercase tracking-widest text-foreground/40">
                    {item.label}
                  </Card.Title>
                  <Card.Description className="text-[11px] font-medium leading-relaxed text-foreground/40">
                    {item.note}
                  </Card.Description>
                </Card.Header>
                <Card.Content className="pt-1 pb-4">
                  <p className="text-[22px] font-black leading-none text-foreground">{item.value}</p>
                  <ProgressBar
                    aria-label={item.label}
                    className="mt-4"
                    color={item.color}
                    value={100}
                  >
                    <ProgressBar.Track className="bg-default/8">
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Earnings Trend Chart ─────────────────────────────── */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card variant="default" className="border-default/6">
            <Card.Header className="gap-1">
              <div className="flex items-center justify-between gap-3">
                <Card.Title className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/40">
                  Earnings Trend
                </Card.Title>
                {projectedEarnings && (
                  <span className="rounded border border-blue-500/20 bg-blue-500/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-400">
                    Projection included
                  </span>
                )}
              </div>
              <Card.Description className="text-[12px] leading-relaxed text-foreground/45">
                Monthly revenue based on your share.{projectedEarnings ? " Dashed line shows projected earnings based on recent trend." : ""}
              </Card.Description>
            </Card.Header>
            <Card.Content className="pb-4">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id={earningsGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={projectedGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: c.tick }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: c.tick }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <RechartsTooltip
                      content={
                        <ChartTooltip
                          c={c}
                          formatValue={(v, name) =>
                            `$${v.toFixed(2)} ${name === "projected" ? "Projected" : "Earnings"}`
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="rgb(16, 185, 129)"
                      strokeWidth={2}
                      fill={`url(#${earningsGradId})`}
                      dot={{ r: 3, fill: "rgb(16, 185, 129)", strokeWidth: 0 }}
                    />
                    {projectedEarnings && (
                      <Area
                        type="monotone"
                        dataKey="projected"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        fill={`url(#${projectedGradId})`}
                        dot={{ r: 3, fill: "rgb(59, 130, 246)", strokeWidth: 0 }}
                        connectNulls={false}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      )}

      {/* ── Middle: Charts ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Top Releases by Your Share */}
        <Card variant="default" className="border-default/6">
          <Card.Header className="gap-1">
            <div className="flex items-center justify-between gap-3">
              <Card.Title className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/40">
                Top Releases by Your Share
              </Card.Title>
              <span className="text-[11px] text-foreground/35">
                {earnings.length} visible records
              </span>
            </div>
            <Card.Description className="text-[12px] leading-relaxed text-foreground/45">
              Ranked by the share visible on the current page, not by label spend.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3 pt-0">
            {earningsByRelease.length === 0 ? (
              <p className="py-6 text-center text-[11px] font-black uppercase tracking-widest text-foreground/25">No earnings data</p>
            ) : (
              earningsByRelease.map((item) => {
                const pct = displayedShareTotal ? Math.round((item.amount / displayedShareTotal) * 100) : 0;
                return (
                  <div key={item.name} className="rounded-2xl border border-default/6 bg-default/3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-foreground">{item.name}</span>
                      <span className="text-[13px] font-black text-emerald-400">{formatCurrency(item.amount)}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-foreground/40">
                      {item.records} statement{item.records === 1 ? "" : "s"} · {item.unpaid} unpaid · {pct}% of visible earnings
                    </p>
                    <ProgressBar
                      aria-label={`${item.name} earnings share`}
                      className="mt-3"
                      color="success"
                      value={pct}
                    >
                      <ProgressBar.Track className="bg-default/8">
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Earnings by Source */}
        <Card variant="default" className="border-default/6">
          <Card.Header className="gap-1">
            <div className="flex items-center justify-between gap-3">
              <Card.Title className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/40">
                Earnings by Source
              </Card.Title>
              <span className="text-[11px] text-foreground/35">
                Page {pagination.page} / {pagination.pages}
              </span>
            </div>
            <Card.Description className="text-[12px] leading-relaxed text-foreground/45">
              Platform mix for the visible statements, based on your actual share.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-2.5 pt-0">
            {earningsBySource.length === 0 ? (
              <p className="py-6 text-center text-[11px] font-black uppercase tracking-widest text-foreground/25">No data</p>
            ) : (
              earningsBySource.map((item) => {
                const pct = displayedShareTotal ? Math.round((item.amount / displayedShareTotal) * 100) : 0;
                return (
                  <div key={item.source} className="rounded-2xl border border-default/6 bg-default/3 px-4 py-3">
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                      <span className="text-[12px] font-black text-foreground">{item.source}</span>
                      <span className="text-[12px] font-black text-emerald-400">{formatCurrency(item.amount)}</span>
                      <span className="text-[11px] font-bold text-foreground/40">{pct}%</span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-foreground/40">
                      {item.records} statement{item.records === 1 ? "" : "s"} · {item.streams.toLocaleString()} streams
                    </p>
                    <ProgressBar
                      aria-label={`${item.source} earnings share`}
                      className="mt-2"
                      color="accent"
                      value={pct}
                    >
                      <ProgressBar.Track className="bg-default/8">
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                );
              })
            )}
          </Card.Content>
        </Card>
      </motion.div>

      {/* ── Bottom: Tables ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Earnings Statement History */}
        <Card variant="default" className="border-default/6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                Earnings Statement History
              </Card.Title>
              <span className="text-[11px] text-foreground/35">
                {pagination.total || earnings.length} total records
              </span>
            </div>
          </Card.Header>
          <Card.Content className="p-0 pt-0">
            <Table aria-label="Revenue share history">
              <Table.ScrollContainer>
                <Table.Content className="min-w-140" selectionMode="none">
                  <Table.Header>
                    <Table.Column isRowHeader id="period">Period</Table.Column>
                    <Table.Column id="release">Release</Table.Column>
                    <Table.Column id="source">Source</Table.Column>
                    <Table.Column id="share">Your Share</Table.Column>
                    <Table.Column id="status">Status</Table.Column>
                  </Table.Header>
                  <Table.Body
                    items={earnings}
                    renderEmptyState={() => (
                      <div className="py-12 text-center text-[11px] font-black uppercase tracking-widest text-foreground/25">
                        No earnings yet
                      </div>
                    )}
                  >
                    {(earning) => {
                      const userShare = calculateUserShare(earning);
                      const userSplit = earning.contract?.splits?.find(
                        (s) => s.userId === sessionUser?.id,
                      );
                      return (
                        <Table.Row key={earning.id} id={earning.id}>
                          <Table.Cell>
                            <span className="text-[12px] font-semibold text-foreground/60">{earning.period}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="text-[12px] font-black text-foreground">
                              {earning.contract?.release?.name || earning.contract?.title || "Unknown"}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                              {String(earning.source || "Unknown")}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="text-[13px] font-black text-emerald-400">
                              {formatCurrency(userShare)}
                            </div>
                            <div className="text-[10px] text-foreground/35">
                              {userSplit ? `${userSplit.percentage}% split` : "Owner"}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={earning.paidToArtist ? "success" : "default"}
                            >
                              <Chip.Label>{earning.paidToArtist ? "Processed" : "Unpaid"}</Chip.Label>
                            </Chip>
                          </Table.Cell>
                        </Table.Row>
                      );
                    }}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>

        {/* Withdrawal History */}
        <Card variant="default" className="border-default/6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                Withdrawal History
              </Card.Title>
              <span className="text-[11px] text-foreground/35">{payments.length} records</span>
            </div>
          </Card.Header>
          <Card.Content className="p-0 pt-0">
            <Table aria-label="Payout log">
              <Table.ScrollContainer>
                <Table.Content selectionMode="none">
                  <Table.Header>
                    <Table.Column isRowHeader id="date">Date</Table.Column>
                    <Table.Column id="amount">Amount</Table.Column>
                    <Table.Column id="method">Method</Table.Column>
                    <Table.Column id="status">Status</Table.Column>
                  </Table.Header>
                  <Table.Body
                    items={payments}
                    renderEmptyState={() => (
                      <div className="py-12 text-center text-[11px] font-black uppercase tracking-widest text-foreground/25">
                        No payout history
                      </div>
                    )}
                  >
                    {(payment) => (
                      <Table.Row key={payment.id} id={payment.id}>
                        <Table.Cell>
                          <span className="text-[12px] text-foreground/55">
                            {payment.createdAt
                              ? new Date(payment.createdAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-[13px] font-black text-foreground">
                            {formatCurrency(Number(payment.amount || 0))}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                            {String(payment.method || "Manual")}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={paymentStatusColor(String(payment.status || "pending"))}
                          >
                            <Chip.Label>{String(payment.status || "pending").toUpperCase()}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      </motion.div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.18 }}
        >
          <Pagination className="w-full justify-between gap-3 max-sm:flex-col">
            <Pagination.Summary className="text-[11px] font-semibold text-foreground/45">
              Showing page {pagination.page} of {pagination.pages} · {pagination.total} total records
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={pagination.page <= 1}
                  onPress={() => onPageChange(Math.max(1, pagination.page - 1))}
                >
                  <Pagination.PreviousIcon />
                  <span>Previous</span>
                </Pagination.Previous>
              </Pagination.Item>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link isActive={p === pagination.page} onPress={() => onPageChange(p)}>
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={pagination.page >= pagination.pages}
                  onPress={() => onPageChange(pagination.page + 1)}
                >
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </motion.div>
      )}
    </div>
  );
}
