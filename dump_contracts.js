const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contracts = await prisma.contract.findMany({
        include: {
            user: true,
            release: true
        }
    });

    console.log(JSON.stringify(contracts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
