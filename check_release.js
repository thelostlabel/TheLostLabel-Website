const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const releases = await prisma.release.findMany({
        where: { name: { contains: 'MONTAGEM NO COMPASSO', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(releases, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
