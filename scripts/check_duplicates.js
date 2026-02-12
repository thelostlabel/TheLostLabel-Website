require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for duplicates...");

    // Check by Name and Artist
    const duplicates = await prisma.$queryRaw`
        SELECT name, "artistName", COUNT(*) as count
        FROM "Release"
        GROUP BY name, "artistName"
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 10;
    `;

    console.log("Potential Duplicates (Same Name & Artist):");
    console.table(duplicates);

    // Check total count again
    const total = await prisma.release.count();
    console.log(`Total releases in DB: ${total}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
