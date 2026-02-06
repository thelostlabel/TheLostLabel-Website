
const { PrismaClient } = require('@prisma/client');
const { getAccessToken } = require('../lib/spotify');

const prisma = new PrismaClient();
const TRACK_ID = '4gtz0OTJdBWZReh77LgBJT';

async function main() {
    const tokenData = await getAccessToken();
    if (!tokenData) {
        console.error('Failed to get Spotify access token');
        return;
    }

    const response = await fetch(`https://api.spotify.com/v1/tracks/${TRACK_ID}`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!response.ok) {
        console.error('Failed to fetch track:', response.status, await response.text());
        return;
    }

    const track = await response.json();
    const album = track.album;

    // Create Release record (using Album ID as Release ID usually, but here the user linked a track)
    // Our schema uses "Release" which maps to Album usually. 
    // If we store it as an album, we should use album details.
    // Users link might be a single track from an album.

    // We'll use the album ID as the key, like the sync script does.

    const releaseData = {
        id: album.id,
        name: album.name,
        artistName: album.artists[0].name,
        image: album.images[0]?.url,
        spotifyUrl: album.external_urls.spotify,
        releaseDate: album.release_date,
        artistsJson: JSON.stringify(album.artists.map(a => ({ id: a.id, name: a.name }))),
        popularity: 100, // Manual override to ensure top visibility
        streamCountText: '68M+' // Manual override
    };

    console.log('Upserting Release:', releaseData);

    await prisma.release.upsert({
        where: { id: album.id },
        update: releaseData,
        create: releaseData
    });

    console.log('Successfully added/updated release.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
