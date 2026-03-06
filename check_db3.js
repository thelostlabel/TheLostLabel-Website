const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const demo = await prisma.demo.findFirst({
        where: { trackLink: "3ffa1d7f-d681-4d40-8d2a-1db31b867f9b" }
    });
    console.log("Demo by trackLink:", demo);
}
main().catch(console.error).finally(() => prisma.$disconnect());
