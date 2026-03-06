const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHistory() {
    const history = await prisma.artistStatsHistory.groupBy({
        by: ['date'],
        _sum: {
            monthlyListeners: true
        },
        where: {
            date: {
                gte: new Date('2026-02-10'),
                lte: new Date('2026-02-25')
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    console.log('Daily Sum of Monthly Listeners (Feb 10-25):');
    history.forEach(h => {
        console.log(`${h.date.toISOString().split('T')[0]}: ${h._sum.monthlyListeners.toLocaleString()}`);
    });
}

checkHistory().catch(console.error).finally(() => prisma.$disconnect());
