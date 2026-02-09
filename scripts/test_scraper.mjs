import { scrapeSpotifyStats } from '../lib/scraper.js';

const url = 'https://open.spotify.com/intl-tr/artist/0AocRNEO5hAP398nPuJV8a?si=z3TMnP24SLyCuodbz6fBHQ';

async function test() {
    console.log("🚀 Testing Browserless Scraper locally...");
    const start = Date.now();
    const data = await scrapeSpotifyStats(url);
    const end = Date.now();

    if (data) {
        console.log("\n✅ SCRAPE SUCCESSFUL!");
        console.log("--------------------");
        console.log(`Artist Name: ${data.name}`);
        console.log(`Monthly Listeners: ${data.monthlyListeners?.toLocaleString()}`);
        console.log(`Followers: ${data.followers?.toLocaleString()}`);
        console.log(`Verified: ${data.verified}`);
        console.log(`Image URL: ${data.imageUrl?.substring(0, 50)}...`);
        console.log("--------------------");
        console.log(`⏱️ Duration: ${end - start}ms`);
    } else {
        console.log("\n❌ SCRAPE FAILED!");
    }
}

test();
