const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing Admin Stats queries...");

        const trendRows = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as label, 
                   SUM("labelAmount") as revenue, 
                   SUM("artistAmount") as "artistShare" 
            FROM "Earning" 
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM') 
            ORDER BY label ASC 
            LIMIT 12
        `;
        console.log("Trend Rows:", trendRows);

        const payoutTrendRows = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as label, 
                   SUM("amount") as amount 
            FROM "Payment" 
            WHERE "status" = 'completed'
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM') 
            ORDER BY label ASC 
            LIMIT 12
        `;
        console.log("Payout Trend Rows:", payoutTrendRows);

        console.log("Success!");
    } catch (e) {
        console.error("Query Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
