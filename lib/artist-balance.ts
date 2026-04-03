import { Prisma } from "@prisma/client";

import { buildArtistOwnedContractScope } from "@/lib/artist-identity";
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

type BalanceContractViewer = {
  userId?: string | null;
  userEmail?: string | null;
  artistId?: string | null;
};

type BalanceContractIdentity = {
  userId: string | null;
  primaryArtistEmail: string | null;
  artist: { id: string; userId: string | null; email: string | null } | null;
};

type BalanceSplitIdentity = {
  percentage: number | null;
  userId: string | null;
  artistId: string | null;
  email: string | null;
  user: { email: string | null } | null;
};

export function calculateOwnedArtistSharePercent({
  viewer,
  contract,
  splits,
}: {
  viewer: BalanceContractViewer;
  contract: BalanceContractIdentity;
  splits: BalanceSplitIdentity[];
}): number {
  const normalizedEmail = String(viewer.userEmail || "").trim().toLowerCase();
  const matchesViewerEmail = (value: string | null | undefined) =>
    Boolean(normalizedEmail) && String(value || "").trim().toLowerCase() === normalizedEmail;

  const viewerOwnsPrimaryContract =
    contract.userId === viewer.userId ||
    (viewer.artistId && contract.artist?.id === viewer.artistId) ||
    contract.artist?.userId === viewer.userId ||
    matchesViewerEmail(contract.primaryArtistEmail) ||
    matchesViewerEmail(contract.artist?.email);

  const ownedSplitPercent = splits.reduce((sum, split) => {
    const matches =
      split.userId === viewer.userId ||
      split.artistId === viewer.artistId ||
      matchesViewerEmail(split.email) ||
      matchesViewerEmail(split.user?.email);

    return matches ? sum + toNumber(split.percentage) : sum;
  }, 0);

  const allSplitPercent = splits.reduce(
    (sum, split) => sum + toNumber(split.percentage),
    0,
  );

  const primaryPercent = viewerOwnsPrimaryContract
    ? Math.max(0, 100 - allSplitPercent)
    : 0;

  return ownedSplitPercent + primaryPercent;
}

export async function getArtistBalanceStats({
  userId,
  userEmail,
  artistId,
}: ArtistBalanceQuery): Promise<ArtistBalanceStats> {
  if (!userId && !artistId && !userEmail) {
    return emptyArtistBalanceStats();
  }

  const contractScope = buildArtistOwnedContractScope({ userId, userEmail, artistId });
  if (!contractScope.length) {
    return emptyArtistBalanceStats();
  }

  const adjustmentWhere: Prisma.BalanceAdjustmentWhereInput = userId && artistId
    ? { OR: [{ userId }, { artistId }] }
    : userId
      ? { userId }
      : artistId
        ? { artistId }
        : {};

  const [earnings, paymentRows, adjustmentTotals] = await Promise.all([
    prisma.earning.findMany({
      where: {
        contract: {
          OR: contractScope,
        },
      },
      select: {
        artistAmount: true,
        createdAt: true,
        source: true,
        streams: true,
        contract: {
          select: {
            userId: true,
            primaryArtistEmail: true,
            artist: {
              select: {
                id: true,
                userId: true,
                email: true,
              },
            },
            splits: {
              select: {
                percentage: true,
                userId: true,
                artistId: true,
                email: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    (userId || artistId)
      ? prisma.payment.groupBy({
          by: ["status"],
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(artistId ? [{ artistId }] : []),
            ],
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

  const sourceStreams: SourceStreams = {};
  const monthlyRows = new Map<string, number>();
  const dailyRows = new Map<string, number>();
  const monthCutoff = new Date(new Date().getFullYear(), new Date().getMonth() - (MONTH_WINDOW - 1), 1);
  const dayCutoff = new Date();
  dayCutoff.setHours(0, 0, 0, 0);
  dayCutoff.setDate(dayCutoff.getDate() - (DAY_WINDOW - 1));

  let totalEarnings = 0;
  let totalStreams = 0;

  for (const earning of earnings) {
    const ownedPercent = calculateOwnedArtistSharePercent({
      viewer: { userId, userEmail, artistId },
      contract: earning.contract,
      splits: earning.contract?.splits || [],
    });
    const earnedAmount = toNumber(earning.artistAmount) * (ownedPercent / 100);

    if (earnedAmount <= 0) {
      continue;
    }

    totalEarnings += earnedAmount;

    const streamCount = toNumber(earning.streams);
    totalStreams += streamCount;
    const sourceKey = String(earning.source || "other").toLowerCase();
    sourceStreams[sourceKey] = (sourceStreams[sourceKey] || 0) + streamCount;

    if (earning.createdAt >= monthCutoff) {
      const label = monthKey(earning.createdAt);
      monthlyRows.set(label, (monthlyRows.get(label) || 0) + earnedAmount);
    }

    if (earning.createdAt >= dayCutoff) {
      const label = dayKey(earning.createdAt);
      dailyRows.set(label, (dailyRows.get(label) || 0) + earnedAmount);
    }
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
    monthlyTrend: buildMonthlySeries(
      Array.from(monthlyRows.entries()).map(([label, value]) => ({ label, value })),
    ),
    dailyTrend: buildDailySeries(
      Array.from(dailyRows.entries()).map(([label, value]) => ({ label, value })),
    ),
    manualAdjustments,
    totalPaid,
    totalPending,
    available,
  };
}
