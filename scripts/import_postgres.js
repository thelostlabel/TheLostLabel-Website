const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function importData() {
    const prisma = new PrismaClient();
    const data = JSON.parse(fs.readFileSync('db_export.json', 'utf8'));

    try {
        console.log('🚀 Starting import to PostgreSQL...');

        // Order matters because of foreign key constraints

        console.log('👥 Importing Users...');
        if (data.users && data.users.length > 0) {
            await prisma.user.createMany({ data: data.users });
        }

        console.log('🎨 Importing Artists...');
        if (data.artists && data.artists.length > 0) {
            await prisma.artist.createMany({ data: data.artists });
        }

        console.log('🎵 Importing Releases...');
        if (data.releases && data.releases.length > 0) {
            await prisma.release.createMany({ data: data.releases });
        }

        console.log('📝 Importing Demos...');
        if (data.demos && data.demos.length > 0) {
            await prisma.demo.createMany({ data: data.demos });
        }

        console.log('📂 Importing Demo Files...');
        if (data.demoFiles && data.demoFiles.length > 0) {
            await prisma.demoFile.createMany({ data: data.demoFiles });
        }

        console.log('📜 Importing Contracts...');
        if (data.contracts && data.contracts.length > 0) {
            await prisma.contract.createMany({ data: data.contracts });
        }

        console.log('✂️ Importing Royalty Splits...');
        if (data.royaltySplits && data.royaltySplits.length > 0) {
            await prisma.royaltySplit.createMany({ data: data.royaltySplits });
        }

        console.log('💰 Importing Earnings...');
        if (data.earnings && data.earnings.length > 0) {
            await prisma.earning.createMany({ data: data.earnings });
        }

        console.log('💳 Importing Payments...');
        if (data.payments && data.payments.length > 0) {
            await prisma.payment.createMany({ data: data.payments });
        }

        console.log('⚙️ Importing System Settings...');
        if (data.systemSettings && data.systemSettings.length > 0) {
            await prisma.systemSettings.createMany({ data: data.systemSettings });
        }

        console.log('📄 Importing Site Content...');
        if (data.siteContent && data.siteContent.length > 0) {
            await prisma.siteContent.createMany({ data: data.siteContent });
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
