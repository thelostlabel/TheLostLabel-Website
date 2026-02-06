const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fields in RoyaltySplit:');
    try {
        // This is a hack to see what fields are available in the typing/client
        const dummy = await prisma.royaltySplit.findFirst();
        console.log(Object.keys(dummy || {}));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
