require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TRACK_ID = '1gQE3IPqYAtYy2gJgBPB6v'; // MONTAGEM NO COMPASSO

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function main() {
    const token = await getAccessToken();

    // 1. Get Track to get Album ID
    console.log("Fetching Track...");
    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${TRACK_ID}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const track = await trackRes.json();

    if (!track.album) {
        console.log("No album found for track.");
        return;
    }

    const albumId = track.album.id;
    console.log(`Album ID: ${albumId}`);

    // 2. Get Album details directly
    console.log("Fetching Album...");
    const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const album = await albumRes.json();

    console.log("Album Name:", album.name);
    console.log("Album Release Date:", album.release_date);
    console.log("Album Release Date Precision:", album.release_date_precision);
}

main().catch(console.error);
