const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get the release we know about
    const release = await prisma.release.findUnique({
        where: { id: '08nMrpLmX8sZilxMF4Qyuk' }
    });
    console.log('Release Artists JSON:', release.artistsJson);

    // 2. Find the user "Grxtor" (or similar) to check their Spotify URL
    // Search by email or artist name if known
    const users = await prisma.user.findMany({
        include: { artist: true }
    });

    console.log('\n--- Checking Users for Grxtor ---');
    for (const u of users) {
        if (u.fullName?.includes('Grxtor') || u.email?.includes('grxtor') || u.artist?.spotifyUrl?.includes('3Oohh6pTxKXeLNeLXgalhe')) {
            console.log(`User: ${u.fullName} (${u.email})`);
            console.log(`  - Role: ${u.role}`);
            console.log(`  - Spotify URL (User): ${u.spotifyUrl}`);
            console.log(`  - Spotify URL (Artist Profile): ${u.artist?.spotifyUrl}`);

            // Replicate extraction logic
            let spotifyId = null;
            if (u.artist?.spotifyUrl) {
                const parts = u.artist.spotifyUrl.split('/').filter(p => p.trim() !== '');
                spotifyId = parts.pop()?.split('?')[0];
            } else if (u.spotifyUrl) {
                const parts = u.spotifyUrl.split('/').filter(p => p.trim() !== '');
                spotifyId = parts.pop()?.split('?')[0];
            }
            console.log(`  - Extracted ID: ${spotifyId}`);

            if (spotifyId && release.artistsJson.includes(spotifyId)) {
                console.log('  => MATCH! This user SHOULD see the release.');
            } else {
                console.log('  => NO MATCH. This user will NOT see the release via Spotify ID.');
            }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
