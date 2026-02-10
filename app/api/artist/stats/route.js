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

        // 1. Fetch Fundamental Data Concurrently
        const [userProfile, artistProfile, payments, releasesCount, demosCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    monthlyListeners: true,
                    artist: {
                        select: {
                            id: true,
                            name: true,
                            monthlyListeners: true
                        }
                    }
                }
            }),
            prisma.artist.findFirst({
                where: {
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
            prisma.release.count({ where: { artistsJson: { contains: stageName } } }),
            prisma.demo.count({ where: { artistId: userId } })
        ]);

        const monthlyListeners = artistProfile?.monthlyListeners || userProfile?.monthlyListeners || userProfile?.artist?.monthlyListeners || 0;

        // 2. Fetch All Splits for this user (with limited fields for speed)
        const splits = await prisma.royaltySplit.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { email: userEmail },
                    { name: stageName }
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

        // 3. Process Trends and Totals
        let totalEarnings = 0;
        let totalStreams = 0;
        const monthlyTrend = {};
        const dailyTrend = {};
        const now = new Date();

        // Initialize last 6 months (monthly view)
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = { label: key, value: 0 };
        }

        // Initialize last 30 days (daily view)
        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
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
                    if (monthlyTrend[key]) {
                        monthlyTrend[key].value += amount;
                    }

                    const dailyKey = d.toISOString().slice(0, 10);
                    if (dailyTrend[dailyKey]) {
                        dailyTrend[dailyKey].value += amount;
                    }
                });
            }
        });

        const totalWithdrawn = payments.reduce((sum, p) => sum + p.amount, 0);

        // 4. Transform Listener History for Frontend Chart
        const listenerTrend = (artistProfile?.statsHistory || [])
            .map(h => ({
                label: new Date(h.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
                value: h.monthlyListeners,
                followers: h.followers || 0
            }))
            .reverse();

        return new Response(JSON.stringify({
            artistId: artistProfile?.id,
            artistName: artistProfile?.name || stageName,
            listeners: monthlyListeners,
            earnings: totalEarnings,
            streams: totalStreams,
            withdrawn: totalWithdrawn,
            balance: totalEarnings - totalWithdrawn,
            releases: releasesCount,
            demos: demosCount,
            trends: Object.values(monthlyTrend).reverse(),
            trendsDaily: Object.values(dailyTrend).reverse(),
            listenerTrend: listenerTrend // New trend data
        }), { status: 200 });

    } catch (e) {
        console.error("Artist Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
