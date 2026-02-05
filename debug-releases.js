const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const email = 'eykoz@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User:', user);

    if (user?.spotifyUrl) {
        const spotifyId = user.spotifyUrl.split('/').pop().split('?')[0];
        console.log(`Extracted Spotify ID: ${spotifyId}`);

        const releases = await prisma.release.findMany({
            where: {
                artistsJson: { contains: spotifyId }
            }
        });
        console.log(`Found ${releases.length} releases for this ID.`);
        if (releases.length > 0) {
            console.log('Sample Release:', releases[0]);
        }
    } else {
        console.log('User has no Spotify URL set.');
    }

    console.log('Checking all releases with "LXGHTLXSS" in name or artistName...');
    const releasesByName = await prisma.release.findMany({
        where: {
            OR: [
                { artistName: { contains: 'LXGHTLXSS' } },
                { artistsJson: { contains: 'LXGHTLXSS' } }
            ]
        }
    });
    console.log(`Found ${releasesByName.length} releases by name.`);
    if (releasesByName.length > 0) {
        console.log('Sample Release by Name:', releasesByName[0]);
    }
}

checkData()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
