const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking Database Content ---");

    // Users
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`\nFound ${users.length} Users (showing max 5):`);
    users.forEach(u => console.log(` - [${u.role}] ${u.stageName || u.fullName} (${u.email})`));

    // Artists
    const artists = await prisma.artist.findMany({ take: 5 });
    console.log(`\nFound ${artists.length} Artists (showing max 5):`);
    artists.forEach(a => console.log(` - ${a.name} (Listeners: ${a.monthlyListeners})`));

    // Demos
    const demos = await prisma.demo.findMany({ take: 5 });
    console.log(`\nFound ${demos.length} Demos (showing max 5):`);
    demos.forEach(d => console.log(` - ${d.title} (Status: ${d.status})`));

    // Contracts
    const contracts = await prisma.contract.findMany({ take: 5 });
    console.log(`\nFound ${contracts.length} Contracts (showing max 5):`);
    contracts.forEach(c => console.log(` - ID: ${c.id.slice(0, 8)}... (Status: ${c.status})`));

    // Earnings
    const earnings = await prisma.earning.findMany({ take: 5, orderBy: { period: 'desc' } });
    console.log(`\nFound ${earnings.length} Earnings (showing max 5):`);
    earnings.forEach(e => console.log(` - ${e.period}: Gross $${e.grossAmount}, Label $${e.labelAmount}, Artist $${e.artistAmount} (Source: ${e.source})`));

    // Payments
    const payments = await prisma.payment.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log(`\nFound ${payments.length} Payments (showing max 5):`);
    payments.forEach(p => console.log(` - ${p.createdAt.toISOString().split('T')[0]}: $${p.amount} (${p.status})`));

    // Releases
    const releases = await prisma.release.findMany({ take: 5 });
    console.log(`\nFound ${releases.length} Releases (showing max 5):`);
    releases.forEach(r => console.log(` - ${r.name} (Type: ${r.type})`));

    console.log("\n--- End of Check ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
