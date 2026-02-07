
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for contracts without releases...");
    const orphans = await prisma.contract.findMany({
        where: { releaseId: null },
        include: { demo: { include: { artist: true } } }
    });

    console.log(`Found ${orphans.length} orphan contracts.`);

    for (const c of orphans) {
        if (!c.demo) {
            console.log(`Skipping contract ${c.id} - No linked demo`);
            continue;
        }

        console.log(`Fixing Contract ${c.title} (${c.id})...`);

        const release = await prisma.release.create({
            data: {
                id: `REL_FIX_${c.id.substring(0, 8)}_${Date.now()}`,
                name: c.title || c.demo.title,
                artistName: c.demo.artist.stageName || c.demo.artist.fullName,
                releaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 14 days out if unknown
                spotifyUrl: c.demo.artist.spotifyUrl,
                artistsJson: JSON.stringify([{ id: c.demo.artist.id, name: c.demo.artist.stageName || c.demo.artist.fullName }]),
                // Link back to contract? One-to-many? No, contract has releaseId.
            }
        });

        await prisma.contract.update({
            where: { id: c.id },
            data: { releaseId: release.id }
        });

        console.log(` -> Created Release ${release.id} and linked.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
