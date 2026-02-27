import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getArtistBalanceStats } from "@/lib/artist-balance";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
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
                        image: true
                    }
                }
            }
        });

        const artistId = userProfile?.artist?.id;
        const artistStageName = userProfile?.artist?.name || stageName;

        let spotifyId = null;
        if (userProfile?.artist?.spotifyUrl) {
            const parts = userProfile.artist.spotifyUrl.split('/').filter((p) => p.trim() !== '');
            const lastPart = parts.pop() || '';
            spotifyId = lastPart.split('?')[0];
        }

        const [artistProfile, releasesAgg, demosCount, financialStats] = await Promise.all([
            prisma.artist.findFirst({
                where: artistId
                    ? { id: artistId }
                    : {
                        OR: [
                            { userId: userId },
                            { email: userEmail },
                            { name: stageName }
                        ]
                    },
                include: {
                    statsHistory: {
                        take: 30,
                        orderBy: { date: 'desc' }
                    }
                }
            }),
            prisma.release.aggregate({
                _count: { id: true },
                _sum: { totalTracks: true },
                where: {
                    OR: [
                        { artistsJson: { contains: artistStageName } },
                        { contracts: { some: { userId: userId } } },
                        ...(spotifyId ? [{ artistsJson: { contains: spotifyId } }] : [])
                    ]
                }
            }),
            prisma.demo.count({ where: { artistId: userId } }),
            getArtistBalanceStats({ userId, userEmail })
        ]);

        const releasesCount = releasesAgg._count.id || 0;
        const totalSongs = releasesAgg._sum.totalTracks || 0;
        const monthlyListeners = artistProfile?.monthlyListeners || userProfile?.monthlyListeners || 0;

        const listenerTrend = (artistProfile?.statsHistory || [])
            .map((h) => ({
                label: new Date(h.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
                value: h.monthlyListeners,
                followers: h.followers || 0
            }))
            .reverse();

        return new Response(JSON.stringify({
            artistId: artistProfile?.id || artistId,
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
            sourceStreams: financialStats.sourceStreams
        }), { status: 200 });
    } catch (e) {
        console.error("Artist Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
