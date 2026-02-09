import { scrapeSpotifyStats } from '../lib/scraper.js';

const urls = [
    'https://open.spotify.com/artist/7I9nmXtGIFw9XUxNG36Q7N',
    'https://open.spotify.com/artist/5mj2wRTtOG1m2r0dm8yPII'
];

async function test() {
    for (const url of urls) {
        console.log(`\n🚀 Testing: ${url}`);
        const start = Date.now();
        const data = await scrapeSpotifyStats(url);
        const end = Date.now();

        if (data) {
            console.log("✅ SUCCESS!");
            console.log(`Artist: ${data.name}`);
            console.log(`Listeners: ${data.monthlyListeners}`);
        } else {
            console.log("❌ FAILED!");
        }
        console.log(`⏱️ Duration: ${end - start}ms`);
    }
}

test();
