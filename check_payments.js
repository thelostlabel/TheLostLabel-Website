const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const paymentCount = await prisma.payment.count();
    console.log(`Total Payments: ${paymentCount}`);

    const samplePayments = await prisma.payment.findMany({ take: 5 });
    console.log('Sample Payments:', JSON.stringify(samplePayments, null, 2));

    // Seed a dummy payment if none exist
    if (paymentCount === 0) {
        const user = await prisma.user.findFirst();
        if (user) {
            await prisma.payment.create({
                data: {
                    userId: user.id,
                    amount: 150.00,
                    currency: 'USD',
                    method: 'Bank Transfer',
                    reference: 'REF-123456',
                    status: 'completed',
                    processedAt: new Date(),
                    notes: 'Quarterly payout'
                }
            });
            console.log("Seeded 1 dummy payment.");
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
