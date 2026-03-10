const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpikes() {
    const spikes = await prisma.artistStatsHistory.findMany({
        where: {
            date: {
                gte: new Date('2026-02-14'),
                lte: new Date('2026-02-20')
            },
            monthlyListeners: {
                gt: 5000000 // Look for artists with > 5M listeners
            }
        },
        include: {
            artist: true
        }
    });

    console.log('Top Artist Listeners (Feb 14-20):');
    spikes.forEach(s => {
        console.log(`${s.date.toISOString().split('T')[0]} | ${s.artist.name}: ${s.monthlyListeners.toLocaleString()}`);
    });
}

checkSpikes().catch(console.error).finally(() => prisma.$disconnect());
