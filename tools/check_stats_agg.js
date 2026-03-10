const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const stats = await prisma.artistStatsHistory.findMany({
        where: {
            date: {
                gte: new Date('2026-02-14T00:00:00Z'),
                lte: new Date('2026-02-22T23:59:59Z')
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    const byDate = {};
    stats.forEach(s => {
        const d = s.date.toISOString().split('T')[0];
        if (!byDate[d]) {
            byDate[d] = { count: 0, totalListeners: 0 };
        }
        byDate[d].count += 1;
        byDate[d].totalListeners += s.monthlyListeners;
    });

    console.log("Aggregated Stats:");
    console.table(byDate);
}

main().catch(console.error).finally(() => prisma.$disconnect());
