require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TRACK_ID = '1gQE3IPqYAtYy2gJgBPB6v';

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
    const response = await fetch(`https://api.spotify.com/v1/tracks/${TRACK_ID}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await response.json();

    console.log("Track Name:", data.name);
    console.log("Album Name:", data.album.name);
    console.log("Release Date:", data.album.release_date);
    console.log("Release Date Precision:", data.album.release_date_precision);
}

main().catch(console.error);
