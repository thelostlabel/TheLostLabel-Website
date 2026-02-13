const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contractId = "a09e7724-c337-4df6-b4c0-5bd7d29bb39f"; // The ID found in previous step

    const earningsData = [
        {
            period: "2026-01",
            grossAmount: 1250.00,
            expenseAmount: 250.00,
            artistAmount: 500.00, // 50% of (1250 - 250)
            labelAmount: 500.00,
            streams: 450000,
            source: "spotify",
            paidToArtist: true
        },
        {
            period: "2025-12",
            grossAmount: 980.00,
            expenseAmount: 0.00,
            artistAmount: 490.00,
            labelAmount: 490.00,
            streams: 320000,
            source: "spotify",
            paidToArtist: true
        },
        {
            period: "2026-02",
            grossAmount: 800.00,
            expenseAmount: 0.00,
            artistAmount: 400.00,
            labelAmount: 400.00,
            streams: 250000,
            source: "apple_music",
            paidToArtist: false
        }
    ];

    for (const data of earningsData) {
        await prisma.earning.create({
            data: {
                contractId,
                ...data,
                currency: "USD"
            }
        });
    }

    console.log("Seeded 3 earning records.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
