
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userEmail = 'abe@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
            contracts: {
                include: {
                    release: true
                }
            }
        }
    });

    console.log("User:", user.email, "ID:", user.id);
    console.log("Spotify URL:", user.spotifyUrl);
    console.log("Contracts Count:", user.contracts.length);

    user.contracts.forEach((c, i) => {
        console.log(`Contract ${i + 1}: ID=${c.id}, Title=${c.title}, ReleaseID=${c.releaseId}`);
        if (c.release) {
            console.log(`   -> Release: Name=${c.release.name}, Date=${c.release.releaseDate}`);
        } else {
            console.log(`   -> NO RELEASE LINKED`);
        }
    });

    if (user.stageName) {
        const releasesByName = await prisma.release.findMany({
            where: { artistName: user.stageName }
        });
        console.log("Releases found by StageName:", releasesByName.length);
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
