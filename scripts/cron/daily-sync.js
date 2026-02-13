require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { scrapePrereleaseData } = require('../../lib/scraper');
const { chromium } = require('playwright');
const prisma = new PrismaClient();

const DEFAULT_PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function getPlaylistTracks(playlistId, accessToken) {
    let items = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const data = await response.json();
        if (data.items) items = items.concat(data.items.filter(item => item.track));
        nextUrl = data.next;
    }
    return items;
}

async function main() {
    console.log(`[${new Date().toISOString()}] Starting Standalone Sync...`);
    let browser = null;
    try {
        const token = await getAccessToken();
        const playlistIds = [DEFAULT_PLAYLIST_ID];

        // Also sync playlists from webhooks
        const webhooks = await prisma.webhook.findMany({ where: { enabled: true } });
        webhooks.forEach(wh => {
            try {
                const config = JSON.parse(wh.config || '{}');
                if (config.playlistId) playlistIds.push(config.playlistId);
            } catch (e) { }
        });

        const allItems = [];
        for (const id of [...new Set(playlistIds)]) {
            const tracks = await getPlaylistTracks(id, token);
            allItems.push(...tracks);
        }

        // Batch fetch full album details (popularity)
        const albumIds = new Set();
        allItems.forEach(item => {
            if (item.track?.album?.id) albumIds.add(item.track.album.id);
        });

        const albumDetailsMap = new Map();
        const albumIdArray = Array.from(albumIds);
        for (let i = 0; i < albumIdArray.length; i += 20) {
            const chunk = albumIdArray.slice(i, i + 20);
            try {
                const res = await fetch(`https://api.spotify.com/v1/albums?ids=${chunk.join(',')}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (data.albums) {
                    data.albums.filter(Boolean).forEach(a => albumDetailsMap.set(a.id, a));
                }
            } catch (e) {
                console.error(`[Sync] Error fetching album details:`, e.message);
            }
        }

        const playlistReleases = new Map();
        for (const item of allItems) {
            if (!item.track || !item.track.album) continue;
            const track = item.track;
            const albumBrief = track.album;
            const fullAlbum = albumDetailsMap.get(albumBrief.id);

            let finalDate = null;
            let finalImage = fullAlbum?.images?.[0]?.url || albumBrief.images?.[0]?.url;

            const releaseDateStr = fullAlbum?.release_date || albumBrief.release_date;
            if (releaseDateStr && releaseDateStr !== '0000') {
                const d = new Date(releaseDateStr);
                if (!isNaN(d.getTime())) finalDate = d;
            }

            // Prerelease check
            if (!finalImage || releaseDateStr === '0000') {
                const prereleaseUrl = `https://open.spotify.com/prerelease/${track.id}`;
                try {
                    if (!browser) browser = await chromium.launch({ headless: true });
                    const scraped = await scrapePrereleaseData(prereleaseUrl, browser);
                    if (scraped) {
                        if (scraped.image) finalImage = scraped.image;
                        if (scraped.releaseDate && !finalDate) {
                            const d = new Date(scraped.releaseDate.replace(/Yayınlanma tarihi:\s*/i, '').replace(/Releases on\s*/i, ''));
                            if (!isNaN(d.getTime())) finalDate = d;
                        }
                    }
                } catch (e) { }
            }

            if (!finalDate) finalDate = item.added_at ? new Date(item.added_at) : new Date();

            const parseReleaseName = (name) => {
                if (!name) return { base: '', version: null };
                const versionRegex = /\s*[-\(\[]\s*(slowed|super slowed|ultra slowed|speed up|sped up|nightcore|instrumental|edit|remix|rework|extended|radio edit|clean|explicit|version|acoustic|live)\s*[\)\]]?/i;
                const match = name.match(versionRegex);

                if (match) {
                    const base = name.replace(versionRegex, '').trim();
                    const version = match[1].trim();
                    return { base, version };
                }
                return { base: name.trim(), version: null };
            };

            const { base, version } = parseReleaseName(fullAlbum?.name || albumBrief.name);

            const releaseId = albumBrief.id;
            if (!playlistReleases.has(releaseId)) {
                playlistReleases.set(releaseId, {
                    id: releaseId,
                    name: fullAlbum?.name || albumBrief.name,
                    baseTitle: base,
                    versionName: version,
                    artistName: (fullAlbum?.artists || albumBrief.artists || []).map(a => a.name).join(', '),
                    image: finalImage,
                    spotifyUrl: fullAlbum?.external_urls?.spotify || albumBrief.external_urls?.spotify,
                    releaseDate: finalDate.toISOString(),
                    artistsJson: JSON.stringify((fullAlbum?.artists || albumBrief.artists || []).map(a => ({ id: a.id, name: a.name }))),
                    type: fullAlbum?.album_type || albumBrief.album_type,
                    totalTracks: fullAlbum?.total_tracks || albumBrief.total_tracks || 1,
                    popularity: fullAlbum?.popularity || track.popularity || 0,
                    previewUrl: track.preview_url
                });
            }
        }

        console.log(`Syncing ${playlistReleases.size} releases...`);
        for (const rel of playlistReleases.values()) {
            await prisma.release.upsert({
                where: { id: rel.id },
                update: {
                    name: rel.name,
                    baseTitle: rel.baseTitle,
                    versionName: rel.versionName,
                    artistName: rel.artistName,
                    image: rel.image,
                    spotifyUrl: rel.spotifyUrl,
                    releaseDate: rel.releaseDate,
                    artistsJson: rel.artistsJson,
                    type: rel.type,
                    totalTracks: rel.totalTracks,
                    popularity: rel.popularity,
                    previewUrl: rel.previewUrl
                },
                create: rel
            });
        }
        console.log("Success!");
    } catch (e) {
        console.error("Sync Error:", e);
    } finally {
        if (browser) await browser.close();
        await prisma.$disconnect();
    }
}

main();
