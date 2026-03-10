import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import type {
  ArtistBalanceQuery,
  ArtistBalanceStats,
  ArtistTotalsRow,
  PaymentStatusAmountRow,
  SeriesRow,
  SourceStreams,
  SourceStreamsRow,
  TrendPoint,
} from "@/lib/finance-types";
import { toNumber } from "@/lib/finance-utils";

const MONTH_WINDOW = 6;
const DAY_WINDOW = 30;

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const dayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildMonthlySeries = (rows: SeriesRow[]): TrendPoint[] => {
  const now = new Date();
  const rowMap = new Map(rows.map((row) => [row.label, toNumber(row.value)]));
  const series: TrendPoint[] = [];

  for (let i = MONTH_WINDOW - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthKey(date);
    series.push({ label, value: rowMap.get(label) ?? 0 });
  }

  return series;
};

const buildDailySeries = (rows: SeriesRow[]): TrendPoint[] => {
  const now = new Date();
  const rowMap = new Map(rows.map((row) => [row.label, toNumber(row.value)]));
  const series: TrendPoint[] = [];

  for (let i = DAY_WINDOW - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const label = dayKey(date);
    series.push({ label, value: rowMap.get(label) ?? 0 });
  }

  return series;
};

function emptyArtistBalanceStats(): ArtistBalanceStats {
  return {
    totalEarnings: 0,
    totalStreams: 0,
    sourceStreams: {},
    monthlyTrend: buildMonthlySeries([]),
    dailyTrend: buildDailySeries([]),
    manualAdjustments: 0,
    totalPaid: 0,
    totalPending: 0,
    available: 0,
  };
}

export async function getArtistBalanceStats({
  userId,
  userEmail,
  artistId,
}: ArtistBalanceQuery): Promise<ArtistBalanceStats> {
  if (!userId && !artistId && !userEmail) {
    return emptyArtistBalanceStats();
  }

  const splitFilters: Prisma.Sql[] = [];

  if (userId) {
    splitFilters.push(Prisma.sql`rs."userId" = ${userId}`);
  }

  if (userEmail) {
    splitFilters.push(Prisma.sql`LOWER(rs."email") = LOWER(${userEmail})`);
  }

  if (artistId) {
    splitFilters.push(Prisma.sql`rs."artistId" = ${artistId}`);
  }

  let splitWhere = splitFilters[0]!;
  for (let index = 1; index < splitFilters.length; index += 1) {
    splitWhere = Prisma.sql`${splitWhere} OR ${splitFilters[index]}`;
  }
  splitWhere = Prisma.sql`(${splitWhere})`;

  const adjustmentWhere: Prisma.BalanceAdjustmentWhereInput = userId && artistId
    ? { OR: [{ userId }, { artistId }] }
    : userId
      ? { userId }
      : artistId
        ? { artistId }
        : {};

  const [totalsRows, sourceRows, monthlyRows, dailyRows, paymentRows, adjustmentTotals] = await Promise.all([
    prisma.$queryRaw<ArtistTotalsRow[]>`
      SELECT
        COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "totalEarnings",
        COALESCE(SUM(COALESCE(e."streams", 0)), 0) AS "totalStreams"
      FROM "RoyaltySplit" rs
      JOIN "Contract" c ON c."id" = rs."contractId"
      JOIN "Earning" e ON e."contractId" = c."id"
      WHERE ${splitWhere}
    `,
    prisma.$queryRaw<SourceStreamsRow[]>`
      SELECT
        LOWER(COALESCE(e."source", 'other')) AS "source",
        COALESCE(SUM(COALESCE(e."streams", 0)), 0) AS "streams"
      FROM "RoyaltySplit" rs
      JOIN "Contract" c ON c."id" = rs."contractId"
      JOIN "Earning" e ON e."contractId" = c."id"
      WHERE ${splitWhere}
      GROUP BY LOWER(COALESCE(e."source", 'other'))
    `,
    prisma.$queryRaw<SeriesRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', e."createdAt"), 'YYYY-MM') AS "label",
        COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "value"
      FROM "RoyaltySplit" rs
      JOIN "Contract" c ON c."id" = rs."contractId"
      JOIN "Earning" e ON e."contractId" = c."id"
      WHERE ${splitWhere}
        AND e."createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
      GROUP BY TO_CHAR(DATE_TRUNC('month', e."createdAt"), 'YYYY-MM')
    `,
    prisma.$queryRaw<SeriesRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', e."createdAt"), 'YYYY-MM-DD') AS "label",
        COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "value"
      FROM "RoyaltySplit" rs
      JOIN "Contract" c ON c."id" = rs."contractId"
      JOIN "Earning" e ON e."contractId" = c."id"
      WHERE ${splitWhere}
        AND e."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY TO_CHAR(DATE_TRUNC('day', e."createdAt"), 'YYYY-MM-DD')
    `,
    userId
      ? prisma.payment.groupBy({
          by: ["status"],
          where: {
            userId,
            status: { in: ["completed", "pending"] },
          },
          _sum: { amount: true },
        })
      : Promise.resolve([] as PaymentStatusAmountRow[]),
    prisma.balanceAdjustment.aggregate({
      where: adjustmentWhere,
      _sum: { amount: true },
    }),
  ]);

  const totals = totalsRows[0];
  const totalEarnings = toNumber(totals?.totalEarnings);
  const totalStreams = toNumber(totals?.totalStreams);

  const sourceStreams: SourceStreams = {};
  for (const row of sourceRows) {
    sourceStreams[row.source || "other"] = toNumber(row.streams);
  }

  let totalPaid = 0;
  let totalPending = 0;
  for (const row of paymentRows) {
    const amount = toNumber(row._sum?.amount);
    if (row.status === "completed") {
      totalPaid = amount;
    }
    if (row.status === "pending") {
      totalPending = amount;
    }
  }

  const manualAdjustments = toNumber(adjustmentTotals._sum.amount);
  const available = totalEarnings + manualAdjustments - totalPaid - totalPending;

  return {
    totalEarnings,
    totalStreams,
    sourceStreams,
    monthlyTrend: buildMonthlySeries(monthlyRows),
    dailyTrend: buildDailySeries(dailyRows),
    manualAdjustments,
    totalPaid,
    totalPending,
    available,
  };
}
