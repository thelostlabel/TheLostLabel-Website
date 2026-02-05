import { chromium } from 'playwright';

export async function scrapeMonthlyListeners(spotifyUrl, existingBrowser = null) {
    if (!spotifyUrl || !spotifyUrl.includes('spotify.com')) {
        console.error("[Scraper] Invalid Spotify URL:", spotifyUrl);
        return null;
    }

    let browser = existingBrowser;
    let shouldCloseBrowser = false;

    try {
        console.log(`[Scraper] Starting scrape for: ${spotifyUrl}`);
        if (!browser) {
            browser = await chromium.launch({ headless: true });
            shouldCloseBrowser = true;
        }

        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        page.setDefaultTimeout(30000);

        // Go to URL and wait for content to load
        await page.goto(spotifyUrl, { waitUntil: 'domcontentloaded' });

        // CRITICAL: Wait for page to fully render (like Python version)
        await page.waitForTimeout(3000);

        // Execute the scraping logic
        const data = await page.evaluate(() => {
            const result = {
                name: null,
                monthly_listeners: null,
                verified: false,
                image_url: null
            };

            try {
                // 1. Name detection
                const h1 = document.querySelector('h1');
                if (h1 && h1.innerText.trim()) {
                    result.name = h1.innerText.trim();
                } else {
                    const metaTitle = document.querySelector('meta[property="og:title"]');
                    if (metaTitle && metaTitle.content) {
                        result.name = metaTitle.content.split('|')[0].trim();
                    }
                }

                // 2. Image detection
                const metaImg = document.querySelector('meta[property="og:image"]');
                if (metaImg) result.image_url = metaImg.content;

                // 3. Script İçinden Veri Çekme (En Sağlam Yöntem - Base64 encoded data)
                const scripts = document.querySelectorAll('script[type="text/plain"]');
                for (const script of scripts) {
                    try {
                        const decoded = atob(script.textContent);
                        if (decoded.includes('monthlyListeners')) {
                            const mlMatch = decoded.match(/"monthlyListeners":([0-9]+)/);
                            if (mlMatch) {
                                result.monthly_listeners = parseInt(mlMatch[1], 10);
                            }
                            const fMatch = decoded.match(/"followers":([0-9]+)/);
                            if (fMatch) result.followers = parseInt(fMatch[1], 10);
                            if (decoded.includes('"verified":true')) result.verified = true;
                        }
                    } catch (e) { }
                }

                // 4. Visible text detection (Fallback)
                if (!result.monthly_listeners) {
                    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    while (node = walk.nextNode()) {
                        const text = node.textContent.toLowerCase();
                        if (text.includes('monthly listener') || text.includes('aylık dinleyici')) {
                            const numMatch = text.match(/([0-9.,\s]+)/);
                            if (numMatch) {
                                const cleanNum = numMatch[1].replace(/[,.\s]/g, '');
                                result.monthly_listeners = parseInt(cleanNum, 10);
                                break;
                            }
                        }
                    }
                }

                // 5. Verification badge
                if (!result.verified) {
                    result.verified = !!document.querySelector('[aria-label="Verified Artist"], [aria-label="Doğrulanmış Sanatçı"]');
                }

            } catch (err) {
                console.error(err);
            }
            return result;
        });

        await page.close();
        await context.close();

        if (data && data.monthly_listeners) {
            console.log(`[Scraper] ✅ ${data.name}: ${data.monthly_listeners.toLocaleString()} monthly listeners`);
            return data.monthly_listeners;
        }

        console.log(`[Scraper] ❌ No monthly listeners found for: ${spotifyUrl}`);
        return null;
    } catch (error) {
        console.error("[Scraper] Critical Error:", error);
        return null;
    } finally {
        if (browser && shouldCloseBrowser) await browser.close();
    }
}
