const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    const splits = await prisma.royaltySplit.findMany({ where: { email: null } });
    console.log('Checking', splits.length, 'splits');
    let updated = 0;
    for (const s of splits) {
        if (s.name.includes('@')) {
            await prisma.royaltySplit.update({
                where: { id: s.id },
                data: { email: s.name.toLowerCase().trim() }
            });
            updated++;
        }
    }
    console.log('Updated', updated, 'splits with email matches');
    process.exit(0);
}

migrate().catch(e => {
    console.error(e);
    process.exit(1);
});
