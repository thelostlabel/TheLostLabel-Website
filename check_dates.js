const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const now = new Date().toISOString();
        const futureReleases = await prisma.release.count({
            where: { releaseDate: { gt: now } }
        });
        const pastReleases = await prisma.release.count({
            where: { releaseDate: { lte: now } }
        });

        console.log(`Future Releases (> ${now}): ${futureReleases}`);
        console.log(`Available Releases (<= ${now}): ${pastReleases}`);

        const releases = await prisma.release.findMany({
            select: { name: true, releaseDate: true },
            take: 5
        });
        releases.forEach(r => console.log(`${r.name}: ${r.releaseDate}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
