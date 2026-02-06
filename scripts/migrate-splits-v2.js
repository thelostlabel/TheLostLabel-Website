const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    const splits = await prisma.royaltySplit.findMany({
        where: { userId: null, email: null }
    });
    console.log('Analyzing', splits.length, 'unlinked splits...');

    for (const s of splits) {
        // Try matching by stageName
        const userByStage = await prisma.user.findFirst({
            where: { stageName: s.name }
        });
        if (userByStage) {
            await prisma.royaltySplit.update({
                where: { id: s.id },
                data: { userId: userByStage.id, email: userByStage.email }
            });
            console.log(`Linked split "${s.name}" to user ${userByStage.email} (StageName match)`);
            continue;
        }

        // Try matching by name as email
        if (s.name.includes('@')) {
            const userByEmail = await prisma.user.findUnique({
                where: { email: s.name.toLowerCase().trim() }
            });
            if (userByEmail) {
                await prisma.royaltySplit.update({
                    where: { id: s.id },
                    data: { userId: userByEmail.id, email: userByEmail.email }
                });
                console.log(`Linked split "${s.name}" to user ${userByEmail.email} (Email match)`);
                continue;
            }
        }

        // Try matching by Artist name
        const artist = await prisma.artist.findFirst({
            where: { name: s.name },
            include: { user: true }
        });
        if (artist) {
            await prisma.royaltySplit.update({
                where: { id: s.id },
                data: {
                    artistId: artist.id,
                    userId: artist.userId || null,
                    email: artist.email || artist.user?.email || null
                }
            });
            console.log(`Linked split "${s.name}" to artist profile "${artist.name}"`);
        }
    }
    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(e => {
    console.error(e);
    process.exit(1);
});
