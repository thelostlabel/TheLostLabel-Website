const { PrismaClient } = require('@prisma/client');
const { scrapePrereleaseData } = require('./lib/scraper');
const { chromium } = require('playwright');
const prisma = new PrismaClient();

async function main() {
    const id = '08nMrpLmX8sZilxMF4Qyuk';
    const url = `https://open.spotify.com/prerelease/${id}`;

    console.log('Scraping...', url);
    const browser = await chromium.launch({ headless: true });
    const data = await scrapePrereleaseData(url, browser);
    console.log('Scraped Data:', data);

    if (data) {
        const rel = await prisma.release.upsert({
            where: { id },
            update: {
                name: data.name || 'Unknown Prerelease',
                image: data.image,
                releaseDate: new Date(data.releaseDate?.replace(/Yayınlanma tarihi:\s*/i, '') || new Date()).toISOString(),
                type: 'album'
            },
            create: {
                id,
                name: data.name || 'Unknown Prerelease',
                image: data.image,
                artistName: 'LXGHTLXSS, DJ JUAN, GRXTOR',
                spotifyUrl: `https://open.spotify.com/album/${id}`,
                releaseDate: new Date(data.releaseDate?.replace(/Yayınlanma tarihi:\s*/i, '') || new Date()).toISOString(),
                type: 'album',
                artistsJson: '[]'
            }
        });
        console.log('Saved to DB:', rel.id);
    }
    await browser.close();
}

main().catch(console.error).finally(() => prisma.$disconnect());
