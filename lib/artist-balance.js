import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const MONTH_WINDOW = 6;
const DAY_WINDOW = 30;

const toNumber = (value) => Number(value || 0);

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const dayKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildMonthlySeries = (rows) => {
    const now = new Date();
    const rowMap = new Map(rows.map((row) => [row.label, toNumber(row.value)]));
    const series = [];

    for (let i = MONTH_WINDOW - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = monthKey(d);
        series.push({ label, value: rowMap.get(label) || 0 });
    }

    return series;
};

const buildDailySeries = (rows) => {
    const now = new Date();
    const rowMap = new Map(rows.map((row) => [row.label, toNumber(row.value)]));
    const series = [];

    for (let i = DAY_WINDOW - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = dayKey(d);
        series.push({ label, value: rowMap.get(label) || 0 });
    }

    return series;
};

export async function getArtistBalanceStats({ userId, userEmail }) {
    if (!userId) {
        return {
            totalEarnings: 0,
            totalStreams: 0,
            sourceStreams: {},
            monthlyTrend: buildMonthlySeries([]),
            dailyTrend: buildDailySeries([]),
            totalPaid: 0,
            totalPending: 0,
            available: 0
        };
    }

    const splitWhere = userEmail
        ? Prisma.sql`(rs."userId" = ${userId} OR rs."email" = ${userEmail})`
        : Prisma.sql`rs."userId" = ${userId}`;

    const [totalsRows, sourceRows, monthlyRows, dailyRows, paymentRows] = await Promise.all([
        prisma.$queryRaw`
            SELECT
                COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "totalEarnings",
                COALESCE(SUM(COALESCE(e."streams", 0)), 0) AS "totalStreams"
            FROM "RoyaltySplit" rs
            JOIN "Contract" c ON c."id" = rs."contractId"
            JOIN "Earning" e ON e."contractId" = c."id"
            WHERE ${splitWhere}
        `,
        prisma.$queryRaw`
            SELECT
                LOWER(COALESCE(e."source", 'other')) AS "source",
                COALESCE(SUM(COALESCE(e."streams", 0)), 0) AS "streams"
            FROM "RoyaltySplit" rs
            JOIN "Contract" c ON c."id" = rs."contractId"
            JOIN "Earning" e ON e."contractId" = c."id"
            WHERE ${splitWhere}
            GROUP BY LOWER(COALESCE(e."source", 'other'))
        `,
        prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('month', e."createdAt"), 'YYYY-MM') AS "label",
                COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "value"
            FROM "RoyaltySplit" rs
            JOIN "Contract" c ON c."id" = rs."contractId"
            JOIN "Earning" e ON e."contractId" = c."id"
            WHERE ${splitWhere}
              AND e."createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
            GROUP BY TO_CHAR(DATE_TRUNC('month', e."createdAt"), 'YYYY-MM')
        `,
        prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('day', e."createdAt"), 'YYYY-MM-DD') AS "label",
                COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS "value"
            FROM "RoyaltySplit" rs
            JOIN "Contract" c ON c."id" = rs."contractId"
            JOIN "Earning" e ON e."contractId" = c."id"
            WHERE ${splitWhere}
              AND e."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
            GROUP BY TO_CHAR(DATE_TRUNC('day', e."createdAt"), 'YYYY-MM-DD')
        `,
        prisma.payment.groupBy({
            by: ['status'],
            where: {
                userId,
                status: { in: ['completed', 'pending'] }
            },
            _sum: { amount: true }
        })
    ]);

    const totals = totalsRows?.[0] || {};
    const totalEarnings = toNumber(totals.totalEarnings);
    const totalStreams = toNumber(totals.totalStreams);

    const sourceStreams = {};
    for (const row of sourceRows || []) {
        sourceStreams[row.source || 'other'] = toNumber(row.streams);
    }

    let totalPaid = 0;
    let totalPending = 0;
    for (const row of paymentRows || []) {
        const amount = toNumber(row._sum?.amount);
        if (row.status === 'completed') totalPaid = amount;
        if (row.status === 'pending') totalPending = amount;
    }

    const available = totalEarnings - totalPaid - totalPending;

    return {
        totalEarnings,
        totalStreams,
        sourceStreams,
        monthlyTrend: buildMonthlySeries(monthlyRows || []),
        dailyTrend: buildDailySeries(dailyRows || []),
        totalPaid,
        totalPending,
        available
    };
}
