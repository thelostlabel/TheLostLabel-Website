const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parseReleaseName = (name) => {
    if (!name) return { base: '', version: null };
    const versionRegex = /\s*[-\(\[]\s*(slowed|super slowed|ultra slowed|speed up|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version|acoustic|live)\s*[\)\]]?/i;
    const match = name.match(versionRegex);

    if (match) {
        const base = name.replace(versionRegex, '').trim();
        const version = match[1].trim();
        return { base, version };
    }
    return { base: name.trim(), version: null };
};

async function main() {
    console.log("Migrating existing releases to include baseTitle and versionName...");
    const releases = await prisma.release.findMany({
        where: {
            OR: [
                { baseTitle: null },
                { versionName: null }
            ]
        }
    });

    console.log(`Found ${releases.length} releases to update.`);

    for (const release of releases) {
        const { base, version } = parseReleaseName(release.name);
        await prisma.release.update({
            where: { id: release.id },
            data: {
                baseTitle: base,
                versionName: version
            }
        });
    }

    console.log("Migration complete!");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
