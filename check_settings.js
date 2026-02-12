const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' }
    });

    if (settings) {
        console.log('Current Config:', settings.config);
        const parsed = JSON.parse(settings.config);
        console.log('YouTube URL:', parsed.youtube);
    } else {
        console.log('No settings found.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
