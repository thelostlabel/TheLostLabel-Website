const { PrismaClient: SQLiteClient } = require('@prisma/client');
const fs = require('fs');

async function exportData() {
    const prisma = new SQLiteClient();

    try {
        console.log('📦 Exporting data from SQLite...');

        const users = await prisma.user.findMany();
        const demos = await prisma.demo.findMany();
        const demoFiles = await prisma.demoFile.findMany();
        const artists = await prisma.artist.findMany();
        const releases = await prisma.release.findMany();
        const contracts = await prisma.contract.findMany();
        const royaltySplits = await prisma.royaltySplit.findMany();
        const earnings = await prisma.earning.findMany();
        const payments = await prisma.payment.findMany();
        const systemSettings = await prisma.systemSettings.findMany();
        const siteContent = await prisma.siteContent.findMany();

        const data = {
            users,
            demos,
            demoFiles,
            artists,
            releases,
            contracts,
            royaltySplits,
            earnings,
            payments,
            systemSettings,
            siteContent
        };

        fs.writeFileSync('db_export.json', JSON.stringify(data, null, 2));
        console.log('✅ Export complete! Shared to db_export.json');

    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
