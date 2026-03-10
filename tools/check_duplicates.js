const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
    const duplicates = await prisma.$queryRaw`
    SELECT 
      "artistId", 
      date_trunc('day', date) as day, 
      COUNT(*) as record_count
    FROM "ArtistStatsHistory"
    GROUP BY "artistId", day
    HAVING COUNT(*) > 1
    ORDER BY day DESC
    LIMIT 20
  `;

    console.log('Duplicate Records per Artist per Day:');
    console.log(JSON.stringify(duplicates, null, 2));
}

checkDuplicates().catch(console.error).finally(() => prisma.$disconnect());
