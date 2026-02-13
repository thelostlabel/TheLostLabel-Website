const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const counts = await prisma.release.groupBy({
            by: ['type'],
            _count: { type: true }
        });
        console.log(counts);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
