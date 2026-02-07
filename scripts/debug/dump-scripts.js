const { chromium } = require('playwright');
const fs = require('fs');

async function dumpScripts(artistId) {
    const url = `https://open.spotify.com/artist/${artistId}`;
    console.log(`Dumping scripts for: ${url}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const scriptsData = await page.evaluate(() => {
        const results = [];
        const scripts = document.querySelectorAll('script[type="text/plain"]');
        scripts.forEach((s, idx) => {
            try {
                const decoded = atob(s.textContent);
                results.push({ idx, length: decoded.length, snippet: decoded.substring(0, 500) });
                // If it contains monthlyListeners, keep more
                if (decoded.includes('monthlyListeners')) {
                    results[results.length - 1].full = decoded;
                }
            } catch (e) {
                results.push({ idx, error: e.message });
            }
        });
        return results;
    });

    fs.writeFileSync('scripts_dump.json', JSON.stringify(scriptsData, null, 2));
    console.log('Scripts dumped to scripts_dump.json');

    await browser.close();
}

dumpScripts(process.argv[2] || '0iPVlUddVxi8XrL3Ju8GAw'); // DJ JUAN
