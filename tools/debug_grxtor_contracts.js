const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const artist = await prisma.artist.findFirst({
        where: { name: { contains: 'grxtor', mode: 'insensitive' } }
    });

    if (!artist) {
        console.log("Artist 'grxtor' not found");
        return;
    }

    console.log("Found Artist:", artist.id, artist.name, "| userId:", artist.userId);

    const contracts = await prisma.contract.findMany({
        include: {
            splits: true
        }
    });
    console.log("Total Contracts in DB:", contracts.length);

    const matchingContracts = contracts.filter(c => {
        const directMatch = c.artistId === artist.id;
        const userMatch = artist.userId && c.userId === artist.userId;
        const emailMatch = artist.email && c.primaryArtistEmail === artist.email;
        const splitMatch = c.splits.some(s => s.artistId === artist.id || (artist.userId && s.userId === artist.userId));

        return directMatch || userMatch || emailMatch || splitMatch;
    });

    console.log("Matching Contracts for 'grxtor':", matchingContracts.length);
    matchingContracts.forEach(c => {
        console.log("- ", c.title || c.id, "| artistId:", c.artistId, "| userId:", c.userId, "| email:", c.primaryArtistEmail);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
