import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const userId = session.user.id;
        const userEmail = session.user.email;
        const stageName = session.user.stageName;

        // 1. Fetch User and Linked Artist Profile first to get the correct identifiers
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

        // Determine identifiers for data fetching
        const artistId = userProfile?.artist?.id;
        const artistStageName = userProfile?.artist?.name || stageName;

        let spotifyId = null;
        if (userProfile?.artist?.spotifyUrl) {
            const parts = userProfile.artist.spotifyUrl.split('/').filter(p => p.trim() !== '');
            const lastPart = parts.pop() || '';
            spotifyId = lastPart.split('?')[0];
        }

        // 2. Fetch Fundamental Data Concurrently based on verified links
        const [artistProfile, payments, releasesAgg, demosCount] = await Promise.all([
            prisma.artist.findFirst({
                where: artistId ? { id: artistId } : {
                    OR: [
                        { userId: userId },
                        { email: userEmail },
                        { name: stageName }
                    ]
                },
                include: {
                    statsHistory: {
                        take: 30, // Last 30 snapshots
                        orderBy: { date: 'desc' }
                    }
                }
            }),
            prisma.payment.findMany({
                where: { userId: userId, status: 'completed' },
                select: { amount: true }
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
            prisma.demo.count({ where: { artistId: userId } })
        ]);

        const releasesCount = releasesAgg._count.id || 0;
        const totalSongs = releasesAgg._sum.totalTracks || 0;

        const monthlyListeners = artistProfile?.monthlyListeners || userProfile?.monthlyListeners || 0;

        // 3. Fetch All Splits for this user
        const splits = await prisma.royaltySplit.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { email: userEmail }
                ]
            },
            include: {
                contract: {
                    select: {
                        earnings: {
                            where: {
                                createdAt: {
                                    gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) // Last 6 months only
                                }
                            },
                            select: {
                                artistAmount: true,
                                streams: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });

        // 4. Process Trends and Totals
        let totalEarnings = 0;
        let totalStreams = 0;
        const monthlyTrend = {};
        const dailyTrend = {};
        const now = new Date();

        // Initialize trends
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = { label: key, value: 0 };
        }

        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            dailyTrend[key] = { label: key, value: 0 };
        }

        splits.forEach(split => {
            const contract = split.contract;
            if (contract && contract.earnings) {
                contract.earnings.forEach(earning => {
                    const amount = (earning.artistAmount * split.percentage) / 100;
                    totalEarnings += amount;
                    if (earning.streams) totalStreams += earning.streams;

                    const d = new Date(earning.createdAt);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyTrend[key]) monthlyTrend[key].value += amount;

                    const dailyKey = d.toISOString().slice(0, 10);
                    if (dailyTrend[dailyKey]) dailyTrend[dailyKey].value += amount;
                });
            }
        });

        const totalWithdrawn = payments.reduce((sum, p) => sum + p.amount, 0);

        // 5. Transform Listener History
        const listenerTrend = (artistProfile?.statsHistory || [])
            .map(h => ({
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
            earnings: totalEarnings,
            streams: totalStreams,
            withdrawn: totalWithdrawn,
            balance: totalEarnings - totalWithdrawn,
            releases: releasesCount,
            songs: totalSongs,
            demos: demosCount,
            trends: Object.values(monthlyTrend).reverse(),
            trendsDaily: Object.values(dailyTrend).reverse(),
            listenerTrend: listenerTrend
        }), { status: 200 });

    } catch (e) {
        console.error("Artist Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
