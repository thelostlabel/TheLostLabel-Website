
import { chromium } from 'playwright';

let globalBrowser = null;
let activeScrapes = 0;
const MAX_CONCURRENT_SCRAPES = 2;

async function acquireScrapeSlot() {
    while (activeScrapes >= MAX_CONCURRENT_SCRAPES) {
        await new Promise((r) => setTimeout(r, 250));
    }
    activeScrapes += 1;
}

function releaseScrapeSlot() {
    activeScrapes = Math.max(0, activeScrapes - 1);
}

export async function scrapeSpotifyStats(spotifyUrl, existingBrowser = null) {
    if (!spotifyUrl || !spotifyUrl.includes('spotify.com')) {
        console.error("[Scraper] Invalid Spotify URL:", spotifyUrl);
        return null;
    }

    let browser = existingBrowser || globalBrowser;
    let shouldCloseBrowser = false;

    try {
        await acquireScrapeSlot();
        console.log(`[Scraper] Starting scrape for: ${spotifyUrl}`);
        if (!browser) {
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled' // CRITICAL: Hide bot flag
                ]
            });
            globalBrowser = browser;
            // No shouldCloseBrowser = true; keep it open globally
        }

        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            // Mobile Emulation to bypass "Your Library" redirect
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });

        const page = await context.newPage();
        page.setDefaultTimeout(30000);

        // Go to URL and wait for content to load (single retry on timeout/network flake)
        try {
            await page.goto(spotifyUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch (navError) {
            console.warn(`[Scraper] First navigation attempt failed, retrying once: ${spotifyUrl}`, navError?.message || navError);
            await page.goto(spotifyUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        }

        // CRITICAL: Wait for page to fully render (Increased for server stability)
        await page.waitForTimeout(10000); // 10 seconds wait

        // Execute the scraping logic
        const data = await page.evaluate(() => {
            const result = {
                name: null,
                monthlyListeners: null, // Mapped from user code's monthly_listeners
                followers: null,
                verified: false,
                imageUrl: null // Mapped from user code's image_url
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

                // 3. Script İçinden Veri Çekme (En Sağlam Yöntem - Base64 encoded data)
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

                // 4. Visible text detection (Fallback)
                if (!result.monthlyListeners) {
                    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    while (node = walk.nextNode()) {
                        const text = node.textContent.toLowerCase();
                        if (text.includes('monthly listener') || text.includes('aylık dinleyici')) {
                            const numMatch = text.match(/([0-9.,\s]+)/);
                            if (numMatch) {
                                const cleanNum = numMatch[1].replace(/[,.\s]/g, '');
                                if (cleanNum.length > 2) {
                                    result.monthlyListeners = parseInt(cleanNum, 10);
                                    break;
                                }
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

        if (data && data.monthlyListeners) {
            console.log(`[Scraper] ✅ ${data.name}: ${data.monthlyListeners?.toLocaleString()} listeners`);
            return data;
        }

        console.log(`[Scraper] ❌ No monthly listeners found for: ${spotifyUrl}`);
        return null;
    } catch (error) {
        console.error("[Scraper] Critical Error:", error);
        return null;
    } finally {
        releaseScrapeSlot();
        if (browser && shouldCloseBrowser) await browser.close();
    }
}

export async function scrapePrereleaseData(url, existingBrowser = null) {
    if (!url || !url.includes('spotify.com/prerelease')) {
        return null;
    }

    let browser = existingBrowser || globalBrowser;
    try {
        if (!browser) {
            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            });
            globalBrowser = browser;
        }

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' }).catch(() => { });
        // Wait for potential encore elements
        await page.waitForSelector('[data-encore-id="text"]', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(5000);

        const data = await page.evaluate(() => {
            const result = {
                image: null,
                releaseDate: null,
                name: null
            };

            // 1. Image detection
            const mainImg = document.querySelector('img[data-testid="track-image"], img[class*="obD7rdENNc2n3fC0"], .obD7rdENNc2n3fC0');
            if (mainImg) {
                result.image = mainImg.src || mainImg.getAttribute('src');
            }

            if (!result.image) {
                const anyImg = document.querySelector('main img, [role="main"] img');
                if (anyImg) result.image = anyImg.src;
            }

            // 2. Name detection
            const h1 = document.querySelector('h1[data-encore-id="text"], h1');
            if (h1) {
                const text = h1.innerText.trim();
                if (text && !text.toLowerCase().includes('library') && !text.toLowerCase().includes('spotify')) {
                    result.name = text;
                }
            }

            // 3. Release Date detection
            const dateEl = document.querySelector('[data-testid="release-date"]');
            if (dateEl) {
                result.releaseDate = dateEl.innerText.trim();
            } else {
                const allTexts = Array.from(document.querySelectorAll('[data-encore-id="text"]'));
                const dateText = allTexts.find(el => {
                    const t = el.innerText;
                    return t.includes('Yayınlanma') || t.includes('Release date') || t.includes('Releases on') || t.includes('February 13');
                });
                if (dateText) result.releaseDate = dateText.innerText.trim();
            }

            return result;
        });

        await page.close();
        await context.close();
        return data;
    } catch (e) {
        console.error("[Scraper] Prerelease Error:", e);
        return null;
    }
}
