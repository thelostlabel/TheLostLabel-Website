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
        console.log("Token retrieved.");

        const items = await getPlaylistTracks(PLAYLIST_ID, token);
        console.log(`Found ${items.length} tracks.`);

        const playlistReleases = new Map();

        items.forEach(item => {
            if (!item.track || !item.track.album) return;
            const track = item.track;
            const album = track.album;

            if (!playlistReleases.has(track.id)) {
                playlistReleases.set(track.id, {
                    id: track.id,
                    name: track.name, // Track Name
                    artistName: track.artists[0]?.name,
                    image: album.images[0]?.url,
                    spotifyUrl: track.external_urls.spotify, // Track URL
                    releaseDate: album.release_date ? new Date(album.release_date) : new Date(),
                    artistsJson: JSON.stringify(track.artists.map(a => ({ id: a.id, name: a.name }))),
                    popularity: track.popularity || 0,
                    previewUrl: track.preview_url // Save preview URL
                });
            }
        });

        const releases = Array.from(playlistReleases.values());
        console.log(`Processing ${releases.length} unique releases...`);

        for (const rel of releases) {
            await prisma.release.upsert({
                where: { id: rel.id },
                update: {
                    name: rel.name,
                    artistName: rel.artistName,
                    image: rel.image,
                    spotifyUrl: rel.spotifyUrl,
                    releaseDate: rel.releaseDate.toISOString(),
                    artistsJson: rel.artistsJson,
                    popularity: rel.popularity,
                    previewUrl: rel.previewUrl
                },
                create: {
                    ...rel,
                    releaseDate: rel.releaseDate.toISOString() // Ensure String
                }
            });
        }

        console.log("Sync complete!");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
