const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const releaseId = '08nMrpLmX8sZilxMF4Qyuk'; // Montagem No Compasso

    // Correct IDs
    const artists = [
        { id: '6fgxSvkznI98Dc33X7FynB', name: 'LXGHTLXSS' },
        { id: '0iPVlUddVxi8XrL3Ju8GAw', name: 'DJ JUAN' },
        { id: '3Oohh6pTxKXeLNeLXgalhe', name: 'GRXTOR' }
    ];

    console.log(`Patching release ${releaseId} with artists:`, artists);

    await prisma.release.update({
        where: { id: releaseId },
        data: {
            artistsJson: JSON.stringify(artists)
        }
    });

    console.log("Patch complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
