const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up duplicate ArtistStatsHistory records...");

    // First, find all records
    const allStats = await prisma.artistStatsHistory.findMany({
        orderBy: { date: 'desc' },
    });

    const seen = new Set();
    const toDelete = [];

    for (const stat of allStats) {
        const day = stat.date.toISOString().split('T')[0];
        const key = `${stat.artistId}-${day}`;

        if (seen.has(key)) {
            toDelete.push(stat.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate records. Deleting...`);
        const res = await prisma.artistStatsHistory.deleteMany({
            where: {
                id: { in: toDelete }
            }
        });
        console.log(`Deleted ${res.count} records.`);
    } else {
        console.log("No duplicates found.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
