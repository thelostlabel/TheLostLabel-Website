const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fileId = "a36a7833-f89a-4b16-8b0b-117542882105";
  const demoFile = await prisma.demoFile.findUnique({
    where: { id: fileId },
  });
  console.log('DemoFile:', demoFile);
}
main().catch(console.error).finally(() => prisma.$disconnect());
