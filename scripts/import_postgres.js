const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function importData() {
    const prisma = new PrismaClient();
    const data = JSON.parse(fs.readFileSync('db_export.json', 'utf8'));

    try {
        console.log('🚀 Starting import to PostgreSQL...');

        // Order matters because of foreign key constraints

        console.log('👥 Importing Users...');
        for (const item of data.users) {
            await prisma.user.create({ data: item });
        }

        console.log('🎨 Importing Artists...');
        for (const item of data.artists) {
            await prisma.artist.create({ data: item });
        }

        console.log('🎵 Importing Releases...');
        for (const item of data.releases) {
            await prisma.release.create({ data: item });
        }

        console.log('📝 Importing Demos...');
        for (const item of data.demos) {
            await prisma.demo.create({ data: item });
        }

        console.log('📂 Importing Demo Files...');
        for (const item of data.demoFiles) {
            await prisma.demoFile.create({ data: item });
        }

        console.log('📜 Importing Contracts...');
        for (const item of data.contracts) {
            await prisma.contract.create({ data: item });
        }

        console.log('✂️ Importing Royalty Splits...');
        for (const item of data.royaltySplits) {
            await prisma.royaltySplit.create({ data: item });
        }

        console.log('💰 Importing Earnings...');
        for (const item of data.earnings) {
            await prisma.earning.create({ data: item });
        }

        console.log('💳 Importing Payments...');
        for (const item of data.payments) {
            await prisma.payment.create({ data: item });
        }

        console.log('⚙️ Importing System Settings...');
        for (const item of data.systemSettings) {
            await prisma.systemSettings.create({ data: item });
        }

        console.log('📄 Importing Site Content...');
        for (const item of data.siteContent) {
            await prisma.siteContent.create({ data: item });
        }

        console.log('✅ Import completed successfully!');

    } catch (error) {
        console.error('❌ Import failed:', error);
        console.log('Hint: Make sure the target database is empty before running this script.');
    } finally {
        await prisma.$disconnect();
    }
}

importData();
