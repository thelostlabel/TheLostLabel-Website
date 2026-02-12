require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

async function getAccessToken() {
    console.log("Getting access token...");
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.access_token;
}

// Helper to get multiple artists in one go
async function getArtistsImages(artistIds, accessToken) {
    if (artistIds.length === 0) return {};

    // Spotify allows max 50 ids per request
    const chunks = [];
    for (let i = 0; i < artistIds.length; i += 50) {
        chunks.push(artistIds.slice(i, i + 50));
    }

    const artistImages = {};
    for (const chunk of chunks) {
        try {
            const ids = chunk.join(',');
            const response = await fetch(`https://api.spotify.com/v1/artists?ids=${ids}`, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            const data = await response.json();
            if (data.artists) {
                data.artists.forEach(artist => {
                    if (artist && artist.images && artist.images.length > 0) {
                        artistImages[artist.id] = artist.images[0].url;
                    }
                });
            }
        } catch (e) {
            console.error("Error fetching artists:", e);
        }
    }
    return artistImages;
}

async function getPlaylistTracks(playlistId, accessToken) {
    let items = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
        console.log(`Fetching page: ${nextUrl}`);
        const response = await fetch(nextUrl, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const data = await response.json();
        if (data.error) {
            console.error("Spotify API Error:", data.error);
            break;
        }
        items = items.concat(data.items.filter(item => item.track));
        nextUrl = data.next;
    }
    return items;
}

async function main() {
    try {
        const token = await getAccessToken();
        const items = await getPlaylistTracks(PLAYLIST_ID, token);
        console.log(`Found ${items.length} tracks in Spotify Playlist.`);

        const validIds = new Set();
        const releasesToUpsert = [];
        const artistIdsToFetch = new Set();

        // Pass 1: Collect tracks and identify missing images
        items.forEach(item => {
            if (!item.track) return;
            const track = item.track;
            const album = track.album;

            // If album image is missing or empty, mark main artist for fetching
            if (!album || !album.images || album.images.length === 0) {
                if (track.artists && track.artists.length > 0) {
                    artistIdsToFetch.add(track.artists[0].id);
                }
            }
        });

        console.log(`Need to fetch images for ${artistIdsToFetch.size} artists...`);
        const artistImages = await getArtistsImages(Array.from(artistIdsToFetch), token);

        // Pass 2: Build upsert objects
        items.forEach(item => {
            if (!item.track) return;
            const track = item.track;
            const album = track.album;

            validIds.add(track.id);

            // Date Logic
            let finalDate;
            if (album && album.release_date && album.release_date !== '0000') {
                const d = new Date(album.release_date);
                if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
                    finalDate = d;
                }
            }
            if (!finalDate && item.added_at) {
                const d = new Date(item.added_at);
                if (!isNaN(d.getTime())) {
                    finalDate = d;
                }
            }
            if (!finalDate) finalDate = new Date();

            // Image Logic
            let finalImage = null;
            if (album && album.images && album.images.length > 0) {
                finalImage = album.images[0].url;
            } else if (track.artists && track.artists.length > 0) {
                // Fallback to artist image
                finalImage = artistImages[track.artists[0].id] || null;
            }

            releasesToUpsert.push({
                id: track.id,
                name: track.name,
                artistName: track.artists.map(a => a.name).join(', '), // Join all artists
                image: finalImage,
                spotifyUrl: track.external_urls.spotify,
                releaseDate: finalDate.toISOString(),
                artistsJson: JSON.stringify(track.artists.map(a => ({ id: a.id, name: a.name }))),
                popularity: track.popularity || 0,
                previewUrl: track.preview_url
            });
        });

        console.log(`Starting sync for ${releasesToUpsert.length} tracks...`);

        for (const rel of releasesToUpsert) {
            await prisma.release.upsert({
                where: { id: rel.id },
                update: {
                    name: rel.name,
                    artistName: rel.artistName,
                    image: rel.image, // Could be null if both album and artist have no image
                    spotifyUrl: rel.spotifyUrl,
                    releaseDate: rel.releaseDate,
                    artistsJson: rel.artistsJson,
                    popularity: rel.popularity,
                    previewUrl: rel.previewUrl,
                    updatedAt: new Date()
                },
                create: {
                    ...rel,
                    updatedAt: new Date()
                }
            });
        }
        console.log("Upsert complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
