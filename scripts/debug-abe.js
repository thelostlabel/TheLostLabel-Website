const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({
        where: { email: 'abe@gmail.com' },
        include: { artist: true }
    });
    console.log('User found:', JSON.stringify(user, null, 2));

    if (user) {
        const contracts = await prisma.contract.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { primaryArtistEmail: 'abe@gmail.com' },
                    { splits: { some: { userId: user.id } } },
                    { splits: { some: { name: { contains: 'abe' } } } }
                ]
            },
            include: { splits: true }
        });
        console.log('Contracts found for user/email:', JSON.stringify(contracts, null, 2));
    } else {
        console.log('User abe@gmail.com not found in User table.');
    }
    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
