const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const r = await prisma.release.findUnique({
        where: { id: '08nMrpLmX8sZilxMF4Qyuk' }
    });
    console.log(JSON.stringify(r, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
