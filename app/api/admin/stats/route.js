import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCachedAdminStats } from "@/lib/admin-stats-cache";

const asNumber = (value) => Number(value || 0);

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const payload = await getCachedAdminStats(async () => {
            const [
                totalUsers,
                totalArtists,
                totalReleases,
                pendingDemos,
                totalDemos,
                pendingRequests,
                uniqueAlbumsRows,
                totalSongs,
                recentDemos,
                recentRequests,
                earningAgg,
                paymentAgg,
                trendRows,
                platformRows,
                topArtists,
                listenerTotals,
                payoutTrendRows,
                listenerTrendRows
            ] = await Promise.all([
                prisma.user.count(),
                prisma.artist.count(),
                prisma.release.count(),
                prisma.demo.count({ where: { status: 'pending' } }),
                prisma.demo.count(),
                prisma.changeRequest.count({ where: { status: 'pending' } }),
                prisma.$queryRaw`
                    SELECT COUNT(DISTINCT COALESCE("baseTitle", "name")) AS "count"
                    FROM "Release"
                `,
                prisma.release.aggregate({
                    _sum: { totalTracks: true }
                }),
                prisma.demo.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { artist: { select: { stageName: true, email: true } } }
                }),
                prisma.changeRequest.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { stageName: true, email: true } } }
                }),
                prisma.earning.aggregate({
                    _sum: { grossAmount: true, artistAmount: true, labelAmount: true }
                }),
                prisma.payment.aggregate({
                    where: { status: 'completed' },
                    _sum: { amount: true }
                }),
                prisma.$queryRaw`
                    SELECT TO_CHAR("createdAt", 'YYYY-MM') as label,
                           COALESCE(SUM("labelAmount"), 0) as revenue,
                           COALESCE(SUM("artistAmount"), 0) as "artistShare"
                    FROM "Earning"
                    GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                    ORDER BY label ASC
                    LIMIT 12
                `,
                prisma.earning.groupBy({
                    by: ['source'],
                    _sum: { labelAmount: true }
                }),
                prisma.artist.findMany({
                    take: 5,
                    orderBy: { monthlyListeners: 'desc' },
                    select: { name: true, monthlyListeners: true, id: true, image: true }
                }),
                prisma.artist.aggregate({
                    _sum: { monthlyListeners: true }
                }),
                prisma.$queryRaw`
                    SELECT TO_CHAR("createdAt", 'YYYY-MM') as label,
                           COALESCE(SUM("amount"), 0) as amount
                    FROM "Payment"
                    WHERE "status" = 'completed'
                    GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                    ORDER BY label ASC
                    LIMIT 12
                `,
                prisma.$queryRaw`
                    SELECT TO_CHAR(date, 'YYYY-MM-DD') as label,
                           SUM("monthlyListeners") as value
                    FROM "ArtistStatsHistory"
                    GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
                    ORDER BY label ASC
                    LIMIT 30
                `
            ]);

            const albumCount = asNumber(uniqueAlbumsRows?.[0]?.count);
            const totalRevenue = asNumber(earningAgg._sum.labelAmount);
            const totalGross = asNumber(earningAgg._sum.grossAmount);
            const totalPayouts = asNumber(paymentAgg._sum.amount);

            const trendData = (trendRows || []).map((r) => ({
                label: r.label,
                revenue: asNumber(r.revenue),
                artistShare: asNumber(r.artistShare)
            }));

            const payoutTrends = (payoutTrendRows || []).map((r) => ({
                label: r.label,
                amount: asNumber(r.amount)
            }));

            const listenerTrends = (listenerTrendRows || []).map((r) => ({
                label: r.label,
                value: asNumber(r.value)
            }));

            const platforms = (platformRows || [])
                .map((p) => ({
                    label: (p.source || 'OTHER').toUpperCase(),
                    value: asNumber(p._sum.labelAmount)
                }))
                .sort((a, b) => b.value - a.value);

            return {
                counts: {
                    users: totalUsers,
                    artists: totalArtists,
                    listenersTotal: listenerTotals._sum.monthlyListeners || 0,
                    pendingDemos,
                    totalDemos,
                    pendingRequests,
                    albums: albumCount,
                    releases: totalReleases,
                    songs: totalSongs._sum.totalTracks || 0,
                    revenue: totalRevenue,
                    gross: totalGross,
                    payouts: totalPayouts
                },
                recent: {
                    demos: recentDemos,
                    requests: recentRequests
                },
                trends: trendData,
                payoutTrends,
                listenerTrends,
                platforms,
                topArtists
            };
        });

        return new Response(JSON.stringify(payload), { status: 200 });
    } catch (e) {
        console.error("Admin Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
