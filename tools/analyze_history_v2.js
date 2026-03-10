const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHistory() {
    const history = await prisma.$queryRaw`
    SELECT 
      date_trunc('day', date) as day,
      SUM("monthlyListeners") as total_listeners,
      COUNT(*) as artist_count
    FROM "ArtistStatsHistory"
    WHERE date >= '2026-02-10' AND date <= '2026-02-28'
    GROUP BY day
    ORDER BY day ASC
  `;

    console.log('Daily Aggregated Monthly Listeners:');
    history.forEach(h => {
        console.log(`${h.day.toISOString().split('T')[0]}: ${Number(h.total_listeners).toLocaleString()} (${h.artist_count} records)`);
    });
}

checkHistory().catch(console.error).finally(() => prisma.$disconnect());
