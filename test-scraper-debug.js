const { chromium } = require('playwright');
const fs = require('fs');

async function testScrape(artistId) {
    const url = `https://open.spotify.com/artist/${artistId}`;
    console.log(`Testing scrape for: ${url}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const content = await page.content();
    fs.writeFileSync('spotify_dump.html', content);
    console.log('Page content dumped to spotify_dump.html');

    const result = await page.evaluate(() => {
        const stats = {
            allScriptsCount: document.querySelectorAll('script').length,
            plainScriptsCount: document.querySelectorAll('script[type="text/plain"]').length,
            jsonScriptsCount: document.querySelectorAll('script[type="application/ld+json"]').length,
            foundMonthly: false,
            foundListener: false,
            matches: []
        };

        // Search in ALL script tags
        const scripts = document.querySelectorAll('script');
        scripts.forEach((s, idx) => {
            const text = s.textContent;
            if (text.includes('monthlyListeners') || text.includes('monthly_listeners')) {
                stats.foundMonthly = true;
                stats.matches.push(`Script ${idx} has monthlyListeners. Type: ${s.type}`);
            }
        });

        // Search in body text
        if (document.body.innerText.includes('monthly listener')) stats.foundListener = true;

        return stats;
    });

    console.log('Stats:', JSON.stringify(result, null, 2));

    // Check for numbers that look like monthly listeners
    const matches = content.match(/[0-9,.]+ monthly listeners/gi) || content.match(/[0-9,.]+ aylık dinleyici/gi);
    console.log('Regex matches in content:', matches);

    await browser.close();
}

testScrape(process.argv[2] || '0iPVlUddVxi8XrL3Ju8GAw'); // DJ JUAN
