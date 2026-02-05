const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const currentSettings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    let config = {};
    if (currentSettings) {
        config = JSON.parse(currentSettings.config);
    }

    // Update genres
    config.genres = ['Phonk', 'Brazilian Funk', 'Funk', 'Hip-Hop', 'Electronic', 'Trap', 'Other'];

    // Ensure basic request settings also exist
    if (config.allowCoverArt === undefined) config.allowCoverArt = true;
    if (config.allowAudio === undefined) config.allowAudio = true;
    if (config.allowDelete === undefined) config.allowDelete = true;
    if (config.allowOther === undefined) config.allowOther = true;

    await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: { config: JSON.stringify(config) },
        create: { id: 'default', config: JSON.stringify(config) }
    });

    console.log('Successfully seeded genres:', config.genres);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
