require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking release dates...");

    const releases = await prisma.release.findMany({
        where: {
            name: {
                contains: 'MONTAGEM NO COMPASSO',
                mode: 'insensitive'
            }
        },
        select: {
            id: true,
            name: true,
            releaseDate: true,
            spotifyUrl: true
        }
    });

    console.table(releases);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
