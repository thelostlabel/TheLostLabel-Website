import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPlaylistTracks, getArtistsDetails } from "@/lib/spotify";
import { scrapeSpotifyStats, scrapePrereleaseData } from "@/lib/scraper";
import { chromium } from 'playwright';
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-errors";

const DEFAULT_PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

// Sync all artists from playlists to database
export async function POST(req) {
    const session = await getServerSession(authOptions);

    // Allow cron job with secret OR admin access
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('secret');
    const scrapeListeners = searchParams.get('scrape') !== 'false';
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    const isAdmin = session?.user?.role === 'admin';

    if (!isValidCron && !isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const startTime = Date.now();
    let browser = null;
    try {
        logger.info('Starting playlist sync process', { scrapeListeners });

        // Fetch all relevant active webhooks
        const allWebhooks = await prisma.webhook.findMany({
            where: { enabled: true }
        });

        // Determine unique playlist IDs to sync
        // Default playlist is always synced if there's at least one listener OR just to keep DB fresh
        const playlistIds = new Set([DEFAULT_PLAYLIST_ID]);

        // Add playlists from webhook configs
        allWebhooks.forEach(wh => {
            if (wh.events?.includes('playlist_update') || wh.events?.includes('new_track')) {
                try {
                    const config = wh.config ? JSON.parse(wh.config) : {};
                    if (config.playlistId) playlistIds.add(config.playlistId);
                } catch (e) {
                    logger.warn('Invalid webhook config JSON', { webhookName: wh.name, error: e.message });
                }
            }
        });

        logger.info('Playlists discovered for sync', { count: playlistIds.size, playlistIds: Array.from(playlistIds) });

        let totalNewReleases = 0;
        let allUniqueArtists = new Set();
        const results = []; // This will store results for artist processing

        // PROCESS EACH PLAYLIST
        for (const playlistId of playlistIds) {
            logger.debug('Processing playlist', { playlistId });

            const items = await getPlaylistTracks(playlistId);
            if (!items) {
                logger.warn('Failed to fetch playlist', { playlistId });
                continue;
            }

            // Extract artists for later scraping
            items.forEach(item => {
                if (item.track?.artists) {
                    item.track.artists.forEach(a => allUniqueArtists.add(a.id));
                }
            });

            // First pass: Collect album IDs
            const albumIds = new Set();
            for (const item of items) {
                if (item.track?.album?.id) albumIds.add(item.track.album.id);
            }

            // Batch fetch full album details (popularity)
            const albumDetailsMap = new Map();
            const albumIdArray = Array.from(albumIds);
            const tokenData = await getAccessToken();

            if (tokenData?.access_token) {
                for (let i = 0; i < albumIdArray.length; i += 20) {
                    const chunk = albumIdArray.slice(i, i + 20);
                    try {
                        const res = await fetch(`https://api.spotify.com/v1/albums?ids=${chunk.join(',')}`, {
                            headers: { Authorization: `Bearer ${tokenData.access_token}` }
                        });
                        const data = await res.json();
                        if (data.albums) {
                            data.albums.filter(Boolean).forEach(a => albumDetailsMap.set(a.id, a));
                        }
                    } catch (e) {
                        logger.error('Failed to fetch album details', e);
                    }
                }
            }

            // Identify New Releases
            const playlistReleases = new Map();
            for (const item of items) {
                if (!item.track || !item.track.album) continue;
                const track = item.track;
                const albumBrief = item.track.album;
                const fullAlbum = albumDetailsMap.get(albumBrief.id);

                // Improved Date Parsing Logic
                let finalDate;
                let finalImage = fullAlbum?.images?.[0]?.url || albumBrief.images?.[0]?.url;

                // 1. Try Album Release Date
                const releaseDateStr = fullAlbum?.release_date || albumBrief.release_date;
                if (releaseDateStr && releaseDateStr !== '0000') {
                    const d = new Date(releaseDateStr);
                    if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
                        finalDate = d;
                    }
                }

                // CHECK FOR PRERELEASE (No image or 0000 date)
                if (!finalImage || releaseDateStr === '0000') {
                    logger.debug('Potential prerelease detected', { trackName: track.name });
                    const prereleaseUrl = `https://open.spotify.com/prerelease/${track.id}`;

                    try {
                        if (!browser) {
                            browser = await chromium.launch({ headless: true });
                        }

                        const scraped = await scrapePrereleaseData(prereleaseUrl, browser);
                        if (scraped) {
                            if (scraped.image) finalImage = scraped.image;
                            if (scraped.releaseDate && !finalDate) {
                                // Try to parse the scraped date
                                const cleanDate = scraped.releaseDate.replace(/Yayınlanma tarihi:\s*/i, '')
                                    .replace(/Releases on\s*/i, '')
                                    .replace(/Release date:\s*/i, '');
                                const d = new Date(cleanDate);
                                if (!isNaN(d.getTime())) finalDate = d;
                            }
                        }
                    } catch (e) {
                        logger.error('Scrape error for prerelease', { trackName: track.name, error: e.message });
                    }
                }

                // 2. Fallback to 'added_at'
                if (!finalDate && item.added_at) {
                    const d = new Date(item.added_at);
                    if (!isNaN(d.getTime())) {
                        finalDate = d;
                    }
                }

                // 3. Fallback to Now
                if (!finalDate) {
                    finalDate = new Date();
                }

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

                // USE ALBUM ID to treat as a proper Release
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
                        type: fullAlbum?.album_type || albumBrief.album_type, // 'album', 'single', or 'ep'
                        totalTracks: fullAlbum?.total_tracks || albumBrief.total_tracks || 1,
                        popularity: fullAlbum?.popularity || track.popularity || 0,
                        previewUrl: track.preview_url
                    });
                }
            }

            // Database Upsert & New Check
            const releases = Array.from(playlistReleases.values());
            const existingReleaseIds = await prisma.release.findMany({
                where: { id: { in: releases.map(r => r.id) } },
                select: { id: true }
            }).then(items => new Set(items.map(i => i.id)));

            const newReleases = releases.filter(r => !existingReleaseIds.has(r.id));
            totalNewReleases += newReleases.length;

            // Upsert Releases
            for (const rel of releases) {
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
                        popularity: rel.popularity,
                        totalTracks: rel.totalTracks,
                        previewUrl: rel.previewUrl
                    },
                    create: rel
                });
            }

            // TRIGGER NOTIFICATIONS (Scoped to this playlist)
            if (newReleases.length > 0) {
                logger.info('Playlist synced with new releases', { playlistId, releaseCount: newReleases.length });

                // Filter webhooks for THIS playlist
                const relevantWebhooks = allWebhooks.filter(wh => {
                    if (!wh.events?.includes('playlist_update') && !wh.events?.includes('new_track')) return false;
                    try {
                        const config = wh.config ? JSON.parse(wh.config) : {};
                        const targetId = config.playlistId || DEFAULT_PLAYLIST_ID;
                        return targetId === playlistId;
                    } catch { return false; }
                });

                if (relevantWebhooks.length > 0) {
                    for (const release of newReleases) {
                        const embed = {
                            title: "🎵 NEW TRACK ADDED",
                            description: `Added to playlist: **${playlistId === DEFAULT_PLAYLIST_ID ? 'LOST OFFICIAL' : 'Custom Playlist'}**`,
                            color: 0x00ff88,
                            fields: [
                                { name: "Track", value: release.name, inline: true },
                                { name: "Artist", value: release.artistName, inline: true },
                                { name: "Released", value: new Date(release.releaseDate).toLocaleDateString(), inline: true }
                            ],
                            thumbnail: { url: release.image },
                            url: release.spotifyUrl,
                            footer: { text: "LOST. Monitor System" },
                            timestamp: new Date().toISOString()
                        };

                        await Promise.all(relevantWebhooks.map(wh =>
                            fetch(wh.url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    username: "LOST Music Bot",
                                    avatar_url: "https://i.imgur.com/AfFp7pu.png",
                                    embeds: [embed]
                                })
                            }).catch(err => logger.error('Failed to send webhook', { webhookName: wh.name, error: err.message }))
                        ));
                    }
                }
            }
        }

        const artistIds = Array.from(allUniqueArtists);
        let successCount = 0;
        let errorCount = 0;
        let retryCount = 0;

        if (scrapeListeners) {
            if (!browser) browser = await chromium.launch({ headless: true });
            const detailedArtists = (await getArtistsDetails(artistIds)).filter(Boolean);

            const failedArtists = [];

            const processArtist = async (artist, isRetry = false) => {
                let monthlyListeners = null;
                const spotifyUrl = artist.external_urls?.spotify;

                try {
                    logger.debug('Processing artist', { artistName: artist.name, isRetry });
                    const data = await scrapeSpotifyStats(spotifyUrl, browser);
                    monthlyListeners = data?.monthlyListeners || null;

                    await prisma.artist.upsert({
                        where: { id: artist.id },
                        update: {
                            name: artist.name,
                            image: artist.images?.[0]?.url || null,
                            followers: artist.followers?.total || null,
                            popularity: artist.popularity || 0,
                            monthlyListeners: monthlyListeners || undefined,
                            lastSyncedAt: new Date(),
                            genres: artist.genres?.join(',') || null
                        },
                        create: {
                            id: artist.id,
                            name: artist.name,
                            image: artist.images?.[0]?.url || null,
                            followers: artist.followers?.total || null,
                            popularity: artist.popularity || 0,
                            monthlyListeners: monthlyListeners || null,
                            lastSyncedAt: new Date(),
                            genres: artist.genres?.join(',') || null
                        }
                    });

                    // Record history
                    if (monthlyListeners) {
                        await prisma.artistStatsHistory.create({
                            data: {
                                artistId: artist.id,
                                monthlyListeners: monthlyListeners,
                                followers: artist.followers?.total || 0,
                                popularity: artist.popularity || 0
                            }
                        });
                    }

                    results.push({
                        id: artist.id,
                        name: artist.name,
                        monthlyListeners,
                        success: true,
                        isRetry
                    });
                    successCount++;
                    if (isRetry) retryCount++;
                } catch (e) {
                    if (!isRetry) {
                        failedArtists.push(artist);
                    } else {
                        errorCount++;
                    }
                    logger.error('Error processing artist', { artistName: artist.name, error: e.message });
                }
            };

            // Chunk process
            const CHUNK_SIZE = 5;
            for (let i = 0; i < detailedArtists.length; i += CHUNK_SIZE) {
                const chunk = detailedArtists.slice(i, i + CHUNK_SIZE);
                await Promise.all(chunk.map(artist => processArtist(artist)));
            }

            // RETRY LOGIC for failed scrapes
            if (failedArtists.length > 0) {
                logger.info('Retrying failed artists', { count: failedArtists.length });
                // Wait 3s before retry
                await new Promise(r => setTimeout(r, 3000));
                for (const artist of failedArtists) {
                    await processArtist(artist, true);
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info('Sync process completed', { 
            duration: `${duration}s`, 
            newReleases: totalNewReleases, 
            artistsScraped: successCount,
            retries: retryCount,
            errors: errorCount
        });

        return new Response(JSON.stringify({
            success: true,
            duration: `${duration}s`,
            playlistsSynced: playlistIds.size,
            newReleasesFound: totalNewReleases,
            totalArtistsProcessed: allUniqueArtists.size,
            artistsScraped: successCount,
            artistRetries: retryCount,
            artistScrapeErrors: errorCount,
            results: results.slice(0, 20)
        }), { status: 200 });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error('Critical sync error', { error: error.message, duration: `${duration}s` });
        return handleApiError(error, 'POST /api/cron/sync-playlist');
    } finally {
        if (browser) await browser.close();
    }
}

// GET: Get sync status and artist count
export async function GET(req) {
    try {
        const totalArtists = await prisma.artist.count();
        const withListeners = await prisma.artist.count({
            where: { monthlyListeners: { not: null } }
        });
        const lastSync = await prisma.artist.findFirst({
            where: { lastSyncedAt: { not: null } },
            orderBy: { lastSyncedAt: 'desc' },
            select: { lastSyncedAt: true }
        });

        return new Response(JSON.stringify({
            totalArtists,
            withListeners,
            lastSync: lastSync?.lastSyncedAt || null,
            playlistId: DEFAULT_PLAYLIST_ID
        }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
