import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const asNumber = (v: unknown): number => Number(v || 0);

interface RevenueRow {
    month: string;
    gross: unknown;
    label_revenue: unknown;
    artist_share: unknown;
    expenses: unknown;
    entry_count: number;
}

interface PayoutRow {
    month: string;
    total: unknown;
}

interface PlatformRow {
    source: string | null;
    gross: unknown;
    label_revenue: unknown;
    streams: number;
    entries: number;
}

interface ListenerRow {
    month: string;
    peak: unknown;
    avg: unknown;
    artist_count: number;
}

interface StreamRow {
    month: string;
    total_streams: number;
}

interface ArtistRevenueRow {
    artist_id: string;
    artist_name: string;
    artist_image: string | null;
    listeners: unknown;
    gross: unknown;
    label_revenue: unknown;
    artist_share: unknown;
    streams: number;
}

export async function GET(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        // Batch 1: revenue trends, platform breakdown, artist count
        const [
            monthlyRevenue,
            monthlyPayouts,
            platformBreakdown,
            artistCount,
            monthlyListeners,
            monthlyStreams,
            artistRevenue,
        ] = await Promise.all([
            prisma.$queryRaw<RevenueRow[]>`
                SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
                       COALESCE(SUM("grossAmount"), 0) as gross,
                       COALESCE(SUM("labelAmount"), 0) as label_revenue,
                       COALESCE(SUM("artistAmount"), 0) as artist_share,
                       COALESCE(SUM("expenseAmount"), 0) as expenses,
                       COUNT(*)::int as entry_count
                FROM "Earning"
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                ORDER BY month ASC
            `,
            prisma.$queryRaw<PayoutRow[]>`
                SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
                       COALESCE(SUM("amount"), 0) as total
                FROM "Payment"
                WHERE "status" = 'completed'
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                ORDER BY month ASC
            `,
            prisma.$queryRaw<PlatformRow[]>`
                SELECT "source",
                       COALESCE(SUM("grossAmount"), 0) as gross,
                       COALESCE(SUM("labelAmount"), 0) as label_revenue,
                       COALESCE(SUM("streams"), 0)::int as streams,
                       COUNT(*)::int as entries
                FROM "Earning"
                WHERE "source" IS NOT NULL
                GROUP BY "source"
                ORDER BY gross DESC
            `,
            prisma.artist.count(),
            prisma.$queryRaw<ListenerRow[]>`
                SELECT TO_CHAR(date, 'YYYY-MM') as month,
                       MAX("monthlyListeners") as peak,
                       AVG("monthlyListeners")::int as avg,
                       COUNT(DISTINCT "artistId")::int as artist_count
                FROM "ArtistStatsHistory"
                GROUP BY TO_CHAR(date, 'YYYY-MM')
                ORDER BY month ASC
            `,
            prisma.$queryRaw<StreamRow[]>`
                SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
                       COALESCE(SUM("streams"), 0)::int as total_streams
                FROM "Earning"
                WHERE "streams" IS NOT NULL
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                ORDER BY month ASC
            `,
            prisma.$queryRaw<ArtistRevenueRow[]>`
                SELECT a."name" as artist_name,
                       a."id" as artist_id,
                       a."image" as artist_image,
                       a."monthlyListeners" as listeners,
                       COALESCE(SUM(e."grossAmount"), 0) as gross,
                       COALESCE(SUM(e."labelAmount"), 0) as label_revenue,
                       COALESCE(SUM(e."artistAmount"), 0) as artist_share,
                       COALESCE(SUM(e."streams"), 0)::int as streams
                FROM "Artist" a
                LEFT JOIN "Contract" c ON c."artistId" = a."id"
                LEFT JOIN "Earning" e ON e."contractId" = c."id"
                GROUP BY a."id", a."name", a."image", a."monthlyListeners"
                HAVING SUM(e."grossAmount") > 0
                ORDER BY gross DESC
                LIMIT 20
            `,
        ]);

        // Build revenue trend with growth rates
        const revenueTrend = (monthlyRevenue || []).map((row, i, arr) => {
            const gross = asNumber(row.gross);
            const prev = i > 0 ? asNumber(arr[i - 1].gross) : 0;
            const growthPct = prev > 0 ? ((gross - prev) / prev) * 100 : null;
            return {
                month: row.month,
                gross,
                labelRevenue: asNumber(row.label_revenue),
                artistShare: asNumber(row.artist_share),
                expenses: asNumber(row.expenses),
                entryCount: row.entry_count,
                growthPct,
            };
        });

        // Build payout map for comparison
        const payoutMap: Record<string, number> = Object.fromEntries(
            (monthlyPayouts || []).map((r) => [r.month, asNumber(r.total)])
        );

        // Revenue vs Payout comparison
        const revenueVsPayout = revenueTrend.map((r) => ({
            month: r.month,
            gross: r.gross,
            labelRevenue: r.labelRevenue,
            payouts: payoutMap[r.month] || 0,
            netRetained: r.labelRevenue - (payoutMap[r.month] || 0),
        }));

        // Platform breakdown
        const platforms = (platformBreakdown || []).map((p) => ({
            source: (p.source || 'OTHER').toUpperCase(),
            gross: asNumber(p.gross),
            labelRevenue: asNumber(p.label_revenue),
            streams: p.streams,
            entries: p.entries,
        }));
        const totalPlatformGross = platforms.reduce((s, p) => s + p.gross, 0);
        const platformsWithShare = platforms.map((p) => ({
            ...p,
            share: totalPlatformGross > 0 ? (p.gross / totalPlatformGross) * 100 : 0,
        }));

        // Listener trends with growth
        const listenerTrend = (monthlyListeners || []).map((row, i, arr) => {
            const avg = asNumber(row.avg);
            const prev = i > 0 ? asNumber(arr[i - 1].avg) : 0;
            const growthPct = prev > 0 ? ((avg - prev) / prev) * 100 : null;
            return {
                month: row.month,
                peak: asNumber(row.peak),
                avg,
                artistCount: row.artist_count,
                growthPct,
            };
        });

        // Stream trends
        const streamTrend = (monthlyStreams || []).map((row) => ({
            month: row.month,
            streams: row.total_streams,
        }));

        // Revenue forecast (simple linear regression on last 6 months)
        const recentRevenue = revenueTrend.slice(-6);
        const forecast: { month: string; projected: number; isProjection: boolean }[] = [];
        if (recentRevenue.length >= 3) {
            const n = recentRevenue.length;
            const xMean = (n - 1) / 2;
            const yMean = recentRevenue.reduce((s, r) => s + r.gross, 0) / n;
            let num = 0, den = 0;
            recentRevenue.forEach((r, i) => {
                num += (i - xMean) * (r.gross - yMean);
                den += (i - xMean) ** 2;
            });
            const slope = den !== 0 ? num / den : 0;
            const intercept = yMean - slope * xMean;

            // Project next 3 months
            const lastMonth = recentRevenue[n - 1].month;
            const [lastY, lastM] = lastMonth.split('-').map(Number);
            for (let f = 1; f <= 3; f++) {
                const projDate = new Date(lastY, lastM - 1 + f, 1);
                const monthLabel = `${projDate.getFullYear()}-${String(projDate.getMonth() + 1).padStart(2, '0')}`;
                const projected = Math.max(0, intercept + slope * (n - 1 + f));
                forecast.push({
                    month: monthLabel,
                    projected: Math.round(projected * 100) / 100,
                    isProjection: true,
                });
            }
        }

        // Per-artist revenue
        const perArtistRevenue = (artistRevenue || []).map((a) => ({
            artistId: a.artist_id,
            artistName: a.artist_name,
            artistImage: a.artist_image,
            listeners: asNumber(a.listeners),
            gross: asNumber(a.gross),
            labelRevenue: asNumber(a.label_revenue),
            artistShare: asNumber(a.artist_share),
            streams: a.streams,
            revenuePerListener: asNumber(a.listeners) > 0
                ? Math.round((asNumber(a.gross) / asNumber(a.listeners)) * 10000) / 10000
                : 0,
        }));

        // Summary KPIs
        const totalGross = revenueTrend.reduce((s, r) => s + r.gross, 0);
        const totalLabel = revenueTrend.reduce((s, r) => s + r.labelRevenue, 0);
        const totalArtistShare = revenueTrend.reduce((s, r) => s + r.artistShare, 0);
        const totalPayoutsSum = Object.values(payoutMap).reduce((s: number, v: number) => s + v, 0);
        const avgMonthlyGross = revenueTrend.length > 0 ? totalGross / revenueTrend.length : 0;
        const lastMonthGross = revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1].gross : 0;
        const prevMonthGross = revenueTrend.length > 1 ? revenueTrend[revenueTrend.length - 2].gross : 0;

        return new Response(JSON.stringify({
            summary: {
                totalGross: Math.round(totalGross * 100) / 100,
                totalLabelRevenue: Math.round(totalLabel * 100) / 100,
                totalArtistShare: Math.round(totalArtistShare * 100) / 100,
                totalPayouts: Math.round(totalPayoutsSum * 100) / 100,
                unpaidBalance: Math.round((totalArtistShare - totalPayoutsSum) * 100) / 100,
                avgMonthlyGross: Math.round(avgMonthlyGross * 100) / 100,
                lastMonthGross: Math.round(lastMonthGross * 100) / 100,
                monthOverMonthGrowth: prevMonthGross > 0
                    ? Math.round(((lastMonthGross - prevMonthGross) / prevMonthGross) * 10000) / 100
                    : null,
                totalArtists: artistCount,
                revenuePerArtist: artistCount > 0 ? Math.round((totalGross / artistCount) * 100) / 100 : 0,
            },
            revenueTrend,
            revenueVsPayout,
            platforms: platformsWithShare,
            listenerTrend,
            streamTrend,
            forecast,
            perArtistRevenue,
        }), { status: 200 });
    } catch (error: unknown) {
        console.error("Analytics Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
