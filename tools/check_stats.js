const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const stats = await prisma.artistStatsHistory.findMany({
        where: {
            date: {
                gte: new Date('2026-02-15T00:00:00Z'),
                lte: new Date('2026-02-20T23:59:59Z')
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    console.log("Stats found:", stats.length);
    stats.forEach(s => {
        console.log(`Date: ${s.date}, Listeners: ${s.monthlyListeners}, ArtistId: ${s.artistId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
