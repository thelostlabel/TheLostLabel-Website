import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getArtistBalanceStats } from "@/lib/artist-balance";
import type { ArtistStatsResponse, ListenerTrendPoint } from "@/lib/finance-types";
import { extractSpotifyArtistIdFromUrl, getErrorMessage } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";

const ARTIST_STATS_HISTORY_SELECT = {
  date: true,
  monthlyListeners: true,
  followers: true,
} satisfies Prisma.ArtistStatsHistorySelect;

export async function GET(req: Request) {
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
    if (artistStageName) {
      releaseWhereClauses.push({ artistsJson: { contains: artistStageName } });
    }
    if (spotifyId) {
      releaseWhereClauses.push({ artistsJson: { contains: spotifyId } });
    }

    const [artistProfile, releasesAgg, demosCount, financialStats] = await Promise.all([
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
        where: {
          OR: releaseWhereClauses,
        },
      }),
      prisma.demo.count({ where: { artistId: userId } }),
      getArtistBalanceStats({ userId, userEmail }),
    ]);

    const releasesCount = releasesAgg._count.id ?? 0;
    const totalSongs = releasesAgg._sum.totalTracks ?? 0;
    const monthlyListeners = artistProfile?.monthlyListeners ?? userProfile?.monthlyListeners ?? 0;

    const listenerTrend: ListenerTrendPoint[] = (artistProfile?.statsHistory ?? [])
      .map((history) => ({
        label: new Date(history.date).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }),
        value: history.monthlyListeners,
        followers: history.followers ?? 0,
      }))
      .reverse();

    const response: ArtistStatsResponse = {
      artistId: artistProfile?.id ?? artistId,
      artistName: artistStageName,
      artistImage: artistProfile?.image || userProfile?.artist?.image,
      listeners: monthlyListeners,
      earnings: financialStats.totalEarnings,
      streams: financialStats.totalStreams,
      withdrawn: financialStats.totalPaid,
      paid: financialStats.totalPaid,
      pending: financialStats.totalPending,
      available: financialStats.available,
      balance: financialStats.available,
      releases: releasesCount,
      songs: totalSongs,
      demos: demosCount,
      trends: financialStats.monthlyTrend,
      trendsDaily: financialStats.dailyTrend,
      listenerTrend,
      sourceStreams: financialStats.sourceStreams,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Artist Stats Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
