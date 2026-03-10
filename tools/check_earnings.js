const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const earningCount = await prisma.earning.count();
        console.log(`Total Earnings: ${earningCount}`);

        const contractCount = await prisma.contract.count();
        console.log(`Total Contracts: ${contractCount}`);

        const recentEarnings = await prisma.earning.findMany({
            take: 5,
            include: {
                contract: {
                    select: {
                        id: true,
                        userId: true,
                        primaryArtistEmail: true,
                        release: { select: { name: true } }
                    }
                }
            }
        });

        console.log('Recent Earnings:', JSON.stringify(recentEarnings, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
