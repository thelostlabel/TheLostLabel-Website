
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const earnings = await prisma.earning.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            contract: {
                include: {
                    splits: true,
                    artist: true,
                    user: true
                }
            }
        }
    });

    console.log(JSON.stringify(earnings, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
