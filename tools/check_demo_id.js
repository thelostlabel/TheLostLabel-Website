const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const fileId = "baf5a2e5-26e2-4d38-a0d6-fba953b4ceed";
    // The ID in the URL is the DEMO id, not the demoFile ID.
    const demo = await prisma.demo.findUnique({
        where: { id: fileId },
        include: { files: true }
    });
    console.log('Demo:', JSON.stringify(demo, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
