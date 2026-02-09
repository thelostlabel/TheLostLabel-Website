const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            status: true
        }
    });
    console.log('--- USER ROLES AUDIT ---');
    console.table(users);
    await prisma.$disconnect();
}

checkUsers().catch(e => {
    console.error(e);
    process.exit(1);
});
