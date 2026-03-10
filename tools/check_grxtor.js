
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const artists = await prisma.artist.findMany({
        where: {
            OR: [
                { name: { contains: 'grxtor', mode: 'insensitive' } },
                { email: { contains: 'grxtor', mode: 'insensitive' } }
            ]
        }
    });
    console.log('Artists found:', JSON.stringify(artists, null, 2));

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { fullName: { contains: 'grxtor', mode: 'insensitive' } },
                { email: { contains: 'grxtor', mode: 'insensitive' } },
                { stageName: { contains: 'grxtor', mode: 'insensitive' } }
            ]
        }
    });
    console.log('Users found:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
