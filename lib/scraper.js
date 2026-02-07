import { chromium } from 'playwright';

export async function scrapeSpotifyStats(spotifyUrl, existingBrowser = null) {
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

        // CRITICAL: Wait for page to fully render
        await page.waitForTimeout(3000);

        // Execute the scraping logic
        const data = await page.evaluate(() => {
            const result = {
                name: null,
                monthlyListeners: null,
                followers: null,
                verified: false,
                imageUrl: null
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
                if (metaImg) result.imageUrl = metaImg.content;

                // 3. Script Data Extraction (Base64) - Primary Method
                const scripts = document.querySelectorAll('script[type="text/plain"]');
                for (const script of scripts) {
                    try {
                        const decoded = atob(script.textContent);
                        if (decoded.includes('monthlyListeners')) {
                            const mlMatch = decoded.match(/"monthlyListeners":([0-9]+)/);
                            if (mlMatch) {
                                result.monthlyListeners = parseInt(mlMatch[1], 10);
                            }
                            const fMatch = decoded.match(/"followers":([0-9]+)/);
                            if (fMatch) result.followers = parseInt(fMatch[1], 10);
                            if (decoded.includes('"verified":true')) result.verified = true;
                        }
                    } catch (e) { }
                }

                // 4. Visible Text Detection (TreeWalker) - Fallback
                if (!result.monthlyListeners) {
                    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    while (node = walk.nextNode()) {
                        const text = node.textContent.toLowerCase();
                        if (text.includes('monthly listener') || text.includes('aylık dinleyici')) {
                            const numMatch = text.match(/([0-9.,\s]+)/);
                            if (numMatch) {
                                const cleanNum = numMatch[1].replace(/[,.\s]/g, '');
                                if (cleanNum.length > 2) { // Filtering out small numbers like "1"
                                    result.monthlyListeners = parseInt(cleanNum, 10);
                                    break;
                                }
                            }
                        }
                    }
                }

                // 5. Verification Badge
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

        if (data && (data.monthlyListeners || data.followers)) {
            console.log(`[Scraper] ✅ ${data.name}: ${data.monthlyListeners?.toLocaleString()} listeners`);
            return data;
        }

        console.log(`[Scraper] ❌ No stats found for: ${spotifyUrl}`);
        return null;

    } catch (error) {
        console.error("[Scraper] Critical Error:", error);
        return null;
    } finally {
        if (browser && shouldCloseBrowser) await browser.close();
    }
}
