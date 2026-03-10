const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ids = [
        "a36a7833-f89a-4b16-8b0b-117542882105",
        "3ffa1d7f-d681-4d40-8d2a-1db31b867f9b"
    ];
    for (const fileId of ids) {
        let demoFile = await prisma.demoFile.findUnique({
            where: { id: fileId },
        });
        console.log(`DemoFile [${fileId}]:`, demoFile);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
