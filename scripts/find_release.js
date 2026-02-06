
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const releases = await prisma.release.findMany({
        where: {
            spotifyUrl: {
                contains: '4gtz0OTJdBWZReh77LgBJT'
            }
        }
    });
    console.log(JSON.stringify(releases, null, 2));
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
