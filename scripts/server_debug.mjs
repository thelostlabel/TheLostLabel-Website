
import { chromium } from 'playwright';
import fs from 'fs';

const url = 'https://open.spotify.com/artist/7I9nmXtGIFw9XUxNG36Q7N';

async function debug() {
    console.log("🕵️‍♂️ Debugging Spotify Page on Server...");
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' // CRITICAL: Hide bot flag
        ]
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        console.log("➡️ Navigating to:", url);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        console.log("⏳ Waiting 10s for render...");
        await page.waitForTimeout(10000);

        const title = await page.title();
        console.log("📄 Page Title:", title);

        const bodyText = await page.textContent('body');
        console.log("📝 Body Text Preview:", bodyText ? bodyText.substring(0, 200).replace(/\n/g, ' ') : "EMPTY BODY");

        const h1 = await page.textContent('h1').catch(() => 'NOT FOUND');
        console.log("🏷️ H1 Tag:", h1);

        // Check for bot detection / empty state
        const isError = await page.isVisible('text=Something went wrong').catch(() => false);
        console.log("⚠️ Is Error Page:", isError);

        // Take a screenshot
        await page.screenshot({ path: 'server_debug.png', fullPage: true });
        console.log("📸 Screenshot saved to server_debug.png");

        // Dump HTML
        const html = await page.content();
        fs.writeFileSync('server_debug.html', html);
        console.log("💾 HTML saved to server_debug.html");

    } catch (e) {
        console.error("❌ CRITICAL ERROR:", e);
    } finally {
        await browser.close();
        console.log("✅ Debug complete.");
    }
}

debug();
