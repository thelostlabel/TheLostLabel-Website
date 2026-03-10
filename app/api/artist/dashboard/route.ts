import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getArtistBalanceStats } from "@/lib/artist-balance";
import { extractSpotifyArtistIdFromUrl, getErrorMessage } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById, getReleaseArtistWhereByName } from "@/lib/release-artists";

const ARTIST_STATS_HISTORY_SELECT = {
  date: true,
  monthlyListeners: true,
  followers: true,
} satisfies Prisma.ArtistStatsHistorySelect;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const userEmail = session.user.email;
    const stageName = session.user.stageName;

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        monthlyListeners: true,
        artist: {
          select: {
            id: true,
            name: true,
            monthlyListeners: true,
            spotifyUrl: true,
            image: true,
          },
        },
      },
    });

    const artistId = userProfile?.artist?.id ?? null;
    const artistStageName = userProfile?.artist?.name || stageName || null;
    const spotifyId = extractSpotifyArtistIdFromUrl(userProfile?.artist?.spotifyUrl);

    const artistWhereClauses: Prisma.ArtistWhereInput[] = [{ userId }];
    if (userEmail) {
      artistWhereClauses.push({ email: userEmail });
    }
    if (stageName) {
      artistWhereClauses.push({ name: stageName });
    }

    const releaseWhereClauses: Prisma.ReleaseWhereInput[] = [{ contracts: { some: { userId } } }];
    const releaseArtistNameClause = getReleaseArtistWhereByName(artistStageName);
    const releaseArtistIdClause = getReleaseArtistWhereById(spotifyId);
    if (releaseArtistNameClause) {
      releaseWhereClauses.push(releaseArtistNameClause);
    }
    if (releaseArtistIdClause) {
      releaseWhereClauses.push(releaseArtistIdClause);
    }

    const releaseWhere: Prisma.ReleaseWhereInput = {
      OR: releaseWhereClauses,
    };

    const [artistProfile, releasesAgg, demosCount, financialStats, releases] = await Promise.all([
      prisma.artist.findFirst({
        where: artistId ? { id: artistId } : { OR: artistWhereClauses },
        include: {
          statsHistory: {
            take: 30,
            orderBy: { date: "desc" },
            select: ARTIST_STATS_HISTORY_SELECT,
          },
        },
      }),
      prisma.release.aggregate({
        _count: { id: true },
        _sum: { totalTracks: true },
        where: releaseWhere,
      }),
      prisma.demo.count({ where: { artistId: userId } }),
      getArtistBalanceStats({ userId, userEmail }),
      prisma.release.findMany({
        where: releaseWhere,
        orderBy: { releaseDate: "desc" },
        include: {
          requests: {
            where: { userId },
            orderBy: { updatedAt: "desc" },
          },
          contracts: {
            where: { userId },
            select: { id: true },
          },
        },
        take: 24,
      }),
    ]);

    const listenerTrend = (artistProfile?.statsHistory ?? [])
      .map((history) => ({
        label: new Date(history.date).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }),
        value: history.monthlyListeners,
        followers: history.followers ?? 0,
      }))
      .reverse();

    const stats = {
      artistId: artistProfile?.id ?? artistId,
      artistName: artistStageName,
      artistImage: artistProfile?.image || userProfile?.artist?.image,
      listeners: artistProfile?.monthlyListeners ?? userProfile?.monthlyListeners ?? 0,
      earnings: financialStats.totalEarnings,
      streams: financialStats.totalStreams,
      withdrawn: financialStats.totalPaid,
      paid: financialStats.totalPaid,
      pending: financialStats.totalPending,
      available: financialStats.available,
      balance: financialStats.available,
      releases: releasesAgg._count.id ?? 0,
      songs: releasesAgg._sum.totalTracks ?? 0,
      demos: demosCount,
      trends: financialStats.monthlyTrend,
      trendsDaily: financialStats.dailyTrend,
      listenerTrend,
      sourceStreams: financialStats.sourceStreams,
    };

    return NextResponse.json({ stats, releases }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
