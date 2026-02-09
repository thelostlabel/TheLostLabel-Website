import { scrapeSpotifyStats } from '../lib/scraper.js';

const url = 'https://open.spotify.com/artist/7I9nmXtGIFw9XUxNG36Q7N';

async function test() {
    console.log("🚀 Testing Provided Scraper Logic...");
    const start = Date.now();
    try {
        const data = await scrapeSpotifyStats(url);
        if (data) {
            console.log("\n✅ SUCCESS!");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log("\n❌ FAILED - No data returned");
        }
    } catch (e) {
        console.error("\n❌ CRITICAL ERROR:", e);
    }
    const end = Date.now();
    console.log(`⏱️ Duration: ${end - start}ms`);
}

test();
