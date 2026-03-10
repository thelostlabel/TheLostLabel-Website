const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const releases = await prisma.release.findMany({
            select: { id: true, name: true, image: true, type: true }
        });

        console.log(`Total Releases: ${releases.length}`);

        const imageCounts = {};
        releases.forEach(r => {
            const img = r.image || 'NULL';
            imageCounts[img] = (imageCounts[img] || 0) + 1;
        });

        console.log(`Unique Images: ${Object.keys(imageCounts).length}`);

        // Show top recurring images
        const sortedImages = Object.entries(imageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        console.log("Top occurring images:");
        sortedImages.forEach(([img, count]) => console.log(`${count} x ${img}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
