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

        // Fetch fundamental artist data
        const profile = await prisma.user.findUnique({
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
        });

        const monthlyListeners = profile?.monthlyListeners || profile?.artist?.monthlyListeners || 0;

        // Find all splits for this user
        const splits = await prisma.royaltySplit.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { email: userEmail },
                    { name: stageName }
                ]
            },
            include: { contract: { include: { earnings: true } } }
        });

        // Calculate earnings and trends
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

        const [releases, demos, payments] = await Promise.all([
            prisma.release.count({ where: { artistsJson: { contains: stageName } } }),
            prisma.demo.count({ where: { artistId: userId } }),
            prisma.payment.findMany({ where: { userId: userId, status: 'completed' } })
        ]);

        const totalWithdrawn = payments.reduce((sum, p) => sum + p.amount, 0);

        return new Response(JSON.stringify({
            listeners: monthlyListeners,
            earnings: totalEarnings,
            streams: totalStreams,
            withdrawn: totalWithdrawn,
            balance: totalEarnings - totalWithdrawn,
            releases: releases,
            demos: demos,
            trends: Object.values(monthlyTrend).reverse(),
            trendsDaily: Object.values(dailyTrend).reverse()
        }), { status: 200 });

    } catch (e) {
        console.error("Artist Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
