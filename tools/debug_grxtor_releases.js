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

    console.log("Found Artist:", artist.id, artist.name);

    const releases = await prisma.release.findMany();
    console.log("Total Releases in DB:", releases.length);

    const matchingReleases = releases.filter(r => {
        const nameMatch = r.artistName?.toLowerCase().includes('grxtor');
        const titleMatch = r.name?.toLowerCase().includes('grxtor');
        let jsonMatch = false;
        if (r.artistsJson) {
            try {
                const parsed = JSON.parse(r.artistsJson);
                jsonMatch = parsed.some(a => a.id === artist.id || (a.name && a.name.toLowerCase().includes('grxtor')));
            } catch (e) { }
        }
        return nameMatch || jsonMatch || titleMatch;
    });

    console.log("Matching Releases for 'grxtor':", matchingReleases.length);
    matchingReleases.slice(0, 5).forEach(r => {
        console.log("- ", r.name, "| artistName:", r.artistName, "| artistsJson:", r.artistsJson);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
