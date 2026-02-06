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

        await page.goto(spotifyUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const data = await page.evaluate(() => {
            const result = {
                name: null,
                monthlyListeners: null,
                followers: null,
                verified: false,
                imageUrl: null
            };

            try {
                // Name
                const h1 = document.querySelector('h1');
                if (h1 && h1.innerText.trim()) {
                    result.name = h1.innerText.trim();
                }

                // Image
                const metaImg = document.querySelector('meta[property="og:image"]');
                if (metaImg) result.imageUrl = metaImg.content;

                // Method 1: Decode React Props (Most reliable if structure hasn't changed)
                const scripts = document.querySelectorAll('script[type="text/plain"]');
                for (const script of scripts) {
                    try {
                        const decoded = atob(script.textContent);
                        if (decoded.includes('monthlyListeners')) {
                            const mlMatch = decoded.match(/"monthlyListeners":([0-9]+)/);
                            if (mlMatch) result.monthlyListeners = parseInt(mlMatch[1], 10);

                            const fMatch = decoded.match(/"followers":([0-9]+)/);
                            if (fMatch) result.followers = parseInt(fMatch[1], 10);

                            if (decoded.includes('"verified":true')) result.verified = true;
                        }
                    } catch (e) { }
                }

                // Method 2: Aria Labels (Accessibility often exposes this)
                if (!result.monthlyListeners) {
                    const listenerElement = document.querySelector('[aria-label*="monthly listeners"], [aria-label*="aylık dinleyici"]');
                    if (listenerElement) {
                        const text = listenerElement.getAttribute('aria-label') || listenerElement.innerText;
                        const numMatch = text.match(/([0-9.,\s]+)/);
                        if (numMatch) {
                            const cleanNum = numMatch[1].replace(/[,.\s]/g, '');
                            result.monthlyListeners = parseInt(cleanNum, 10);
                        }
                    }
                }

                // Method 3: Text Search (Fallback)
                if (!result.monthlyListeners) {
                    // Look for specific text containers that usually hold the stats
                    const allDivs = document.querySelectorAll('div, span, p');
                    for (const el of allDivs) {
                        const text = el.innerText?.toLowerCase() || '';
                        if ((text.includes('monthly listeners') || text.includes('aylık dinleyici')) && text.length < 50) {
                            // Usually "1,234,567 monthly listeners"
                            const numMatch = text.match(/([0-9.,]+)\s*(monthly listeners|aylık dinleyici)/);
                            if (numMatch) {
                                const cleanNum = numMatch[1].replace(/[,.]/g, ''); // Be careful with decimals vs thousands
                                result.monthlyListeners = parseInt(cleanNum, 10);
                                break;
                            }

                            // Or sometimes just the number is in a sibling/parent
                            // Heuristic: check if text starts with number
                            const startNumMatch = text.match(/^([0-9.,\s]+)/);
                            if (startNumMatch) {
                                const cleanNum = startNumMatch[1].replace(/[,.\s]/g, '');
                                if (cleanNum.length > 2) { // Avoid small numbers unlikely to be listener counts unless new
                                    result.monthlyListeners = parseInt(cleanNum, 10);
                                    break;
                                }
                            }
                        }
                    }
                }

                // Verified Status Check
                if (!result.verified) {
                    result.verified = !!document.querySelector('[aria-label="Verified Artist"], [aria-label="Doğrulanmış Sanatçı"]');
                    if (!result.verified) {
                        // Check for the blue tick SVG
                        const svg = document.querySelector('svg[data-testid="verified-icon"]'); // hypothetical selector
                        if (svg) result.verified = true;
                    }
                }
            } catch (err) { }
            return result;
        });

        await page.close();
        await context.close();

        if (data && (data.monthlyListeners || data.followers)) {
            console.log(`[Scraper] ✅ ${data.name}: ${data.monthlyListeners?.toLocaleString()} listeners, ${data.followers?.toLocaleString()} followers`);
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
