import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const [
            totalUsers,
            totalArtists,
            pendingDemos,
            totalDemos,
            pendingRequests,
            uniqueAlbumsGroup,
            totalSongs,
            recentDemos,
            recentRequests
        ] = await Promise.all([
            prisma.user.count(),
            prisma.artist.count(),
            prisma.demo.count({ where: { status: 'pending' } }),
            prisma.demo.count(),
            prisma.changeRequest.count({ where: { status: 'pending' } }),
            prisma.release.groupBy({
                by: ['baseTitle'],
                _count: { baseTitle: true }
            }),
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
            })
        ]);

        // Calculate unique albums
        const albumCount = uniqueAlbumsGroup.length;

        // Financial aggregates (PostgreSQL compatible)
        const [earningAgg, paymentAgg, trendRows, platformRows, topArtists] = await Promise.all([
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
                select: { name: true, monthlyListeners: true, id: true }
            })
        ]);

        // Payment Trends (PostgreSQL compatible)
        const payoutTrendRows = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as label, 
                   COALESCE(SUM("amount"), 0) as amount 
            FROM "Payment" 
            WHERE "status" = 'completed'
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM') 
            ORDER BY label ASC 
            LIMIT 12
        `;

        // Monthly Listener Trends (Aggregate across all artists)
        const listenerTrendRows = await prisma.$queryRaw`
            SELECT TO_CHAR(date, 'YYYY-MM-DD') as label, 
                   SUM("monthlyListeners") as value
            FROM "ArtistStatsHistory"
            GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
            ORDER BY label ASC
            LIMIT 30
        `;

        const totalRevenue = earningAgg._sum.labelAmount || 0;
        const totalGross = earningAgg._sum.grossAmount || 0;
        const totalPayouts = paymentAgg._sum.amount || 0;

        const trendData = (trendRows || []).map(r => ({
            label: r.label,
            revenue: Number(r.revenue) || 0,
            artistShare: Number(r.artistShare) || 0
        }));

        const payoutTrends = (payoutTrendRows || []).map(r => ({
            label: r.label,
            amount: Number(r.amount) || 0
        }));

        const listenerTrends = (listenerTrendRows || []).map(r => ({
            label: r.label,
            value: Number(r.value) || 0
        }));

        const platforms = (platformRows || [])
            .map(p => ({ label: (p.source || 'OTHER').toUpperCase(), value: Number(p._sum.labelAmount) || 0 }))
            .sort((a, b) => b.value - a.value);

        return new Response(JSON.stringify({
            counts: {
                users: totalUsers,
                artists: totalArtists,
                pendingDemos,
                totalDemos,
                pendingRequests,
                albums: albumCount,
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
        }), { status: 200 });

    } catch (e) {
        console.error("Admin Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
