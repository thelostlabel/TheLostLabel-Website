import type { Prisma } from "@prisma/client";

export type NumericLike = number | string | bigint | Prisma.Decimal | null | undefined;

export type TrendPoint = {
  label: string;
  value: number;
};

export type ListenerTrendPoint = {
  label: string;
  value: number;
  followers: number;
};

export type SourceStreams = Record<string, number>;

export type ArtistBalanceQuery = {
  userId?: string | null;
  userEmail?: string | null;
  artistId?: string | null;
};

export type ArtistBalanceStats = {
  totalEarnings: number;
  totalStreams: number;
  sourceStreams: SourceStreams;
  monthlyTrend: TrendPoint[];
  dailyTrend: TrendPoint[];
  manualAdjustments: number;
  totalPaid: number;
  totalPending: number;
  available: number;
};

export type ArtistTotalsRow = {
  totalEarnings: NumericLike;
  totalStreams: NumericLike;
};

export type SourceStreamsRow = {
  source: string | null;
  streams: NumericLike;
};

export type SeriesRow = {
  label: string;
  value: NumericLike;
};

export type PaymentStatusAmountRow = {
  status: string;
  _sum: {
    amount: number | null;
  };
};

export type ArtistStatsResponse = {
  artistId: string | null;
  artistName: string | null;
  artistImage: string | null | undefined;
  listeners: number;
  earnings: number;
  streams: number;
  withdrawn: number;
  paid: number;
  pending: number;
  available: number;
  balance: number;
  releases: number;
  songs: number;
  demos: number;
  trends: TrendPoint[];
  trendsDaily: TrendPoint[];
  listenerTrend: ListenerTrendPoint[];
  sourceStreams: SourceStreams;
};

export type PaymentUserSummary = {
  id: string;
  stageName: string | null;
  email: string;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  status: string;
  processedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: PaymentUserSummary;
};

export type PaymentsResponse = {
  payments: PaymentRecord[];
};

export type ArtistBalanceAdjustmentRecord = {
  id: string;
  artistId: string;
  userId: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  createdById: string;
  createdAt: Date;
  createdBy: {
    id: string;
    email: string;
    stageName: string | null;
    fullName: string | null;
  } | null;
};

export type AdminArtistBalanceResponse = {
  artist: {
    id: string;
    name: string;
    userId: string | null;
    email: string | null;
  };
  stats: ArtistBalanceStats;
  adjustments: ArtistBalanceAdjustmentRecord[];
};
