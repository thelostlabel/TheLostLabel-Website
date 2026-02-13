import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { scrapePrereleaseData } from '../../lib/scraper.js';
import { chromium } from 'playwright';

// Load .env manualy to ensure it works in all environments
try {
    const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
        ? path.resolve(process.cwd(), '.env.local')
        : path.resolve(process.cwd(), '.env');

    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim().replace(/^[\"\']|[\"\']$/g, '');
            process.env[key] = value;
        }
    });
} catch (e) {
    console.warn("Could not load .env file", e.message);
}

const prisma = new PrismaClient();
const DEFAULT_PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

async function getAccessToken() {
    const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
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
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data.items) {
            items = items.concat(data.items.filter(item => item.track));
            nextUrl = data.next;
        } else {
            nextUrl = null;
        }
    }
    return items;
}

async function main() {
    console.log(`[${new Date().toISOString()}] Starting Standalone Sync (MJS)...`);
    let browser = null;
    try {
        const token = await getAccessToken();
        if (!token) throw new Error("Failed to get Spotify access token");

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
            console.log(`Fetching tracks for playlist: ${id}`);
            const tracks = await getPlaylistTracks(id, token);
            allItems.push(...tracks);
        }

        const playlistReleases = new Map();
        for (const item of allItems) {
            if (!item.track || !item.track.album) continue;
            const track = item.track;
            const album = track.album;

            let finalDate = null;
            let finalImage = album.images?.[0]?.url;

            if (album.release_date && album.release_date !== '0000') {
                const d = new Date(album.release_date);
                if (!isNaN(d.getTime())) finalDate = d;
            }

            // Prerelease check
            if (!finalImage || album.release_date === '0000') {
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

            const releaseId = album.id;
            if (!playlistReleases.has(releaseId)) {
                playlistReleases.set(releaseId, {
                    id: releaseId,
                    name: album.name,
                    artistName: (album.artists || []).map(a => a.name).join(', '),
                    image: finalImage,
                    spotifyUrl: album.external_urls?.spotify,
                    releaseDate: finalDate.toISOString(),
                    artistsJson: JSON.stringify((album.artists || []).map(a => ({ id: a.id, name: a.name }))),
                    type: album.album_type,
                    totalTracks: album.total_tracks || 1,
                    popularity: track.popularity || 0,
                    previewUrl: track.preview_url
                });
            }
        }

        console.log(`Syncing ${playlistReleases.size} unique releases...`);
        for (const rel of playlistReleases.values()) {
            await prisma.release.upsert({
                where: { id: rel.id },
                update: {
                    name: rel.name,
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
        console.log("Sync completed successfully!");
    } catch (e) {
        console.error("Sync Error:", e);
    } finally {
        if (browser) await browser.close();
        await prisma.$disconnect();
    }
}

main();
