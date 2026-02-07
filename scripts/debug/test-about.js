const { chromium } = require('playwright');
const fs = require('fs');

async function testAboutPage(artistId) {
    const url = `https://open.spotify.com/artist/${artistId}/about`;
    console.log(`Testing about page for: ${url}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const content = await page.content();
    fs.writeFileSync('about_dump.html', content);

    const result = await page.evaluate(() => {
        const data = {
            foundMonthly: false,
            monthly_listeners: null,
            textMatches: []
        };

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const t = node.textContent.toLowerCase();
            if (t.includes('monthly listener') || t.includes('aylık dinleyici')) {
                data.foundMonthly = true;
                data.textMatches.push(node.textContent.trim());
                const numMatch = t.match(/([0-9.,\s]+)/);
                if (numMatch) {
                    const cleanNum = numMatch[1].replace(/[,.\s]/g, '');
                    data.monthly_listeners = parseInt(cleanNum, 10);
                }
            }
        }
        return data;
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    await browser.close();
}

testAboutPage(process.argv[2] || '0iPVlUddVxi8XrL3Ju8GAw'); // DJ JUAN
