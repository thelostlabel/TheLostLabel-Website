const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

let cachedToken = null;
let tokenExpiry = 0;

export const getAccessToken = async () => {
    if (!client_id || !client_secret) return null;

    // Return cached token if still valid (5 min buffer)
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
        return { access_token: cachedToken };
    }

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    try {
        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ grant_type: 'client_credentials' }),
            cache: 'no-store'
        });

        const data = await response.json();
        if (response.ok) {
            cachedToken = data.access_token;
            tokenExpiry = Date.now() + (data.expires_in * 1000);
            return data;
        }
        return null;
    } catch (error) {
        console.error("Spotify Auth Error:", error);
        return null;
    }
};

export const getAlbum = async (id) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            next: { revalidate: 3600 }
        });
        return response.ok ? await response.json() : null;
    } catch (e) { return null; }
};

export const getPlaylistTracks = async (playlistId) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    try {
        while (nextUrl) {
            const response = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
                next: { revalidate: 3600 }
            });
            const data = await response.json();
            if (!response.ok) break;

            allTracks = [...allTracks, ...data.items];
            nextUrl = data.next;
        }
        return allTracks;
    } catch (error) {
        console.error("Spotify Playlist Sync Error:", error);
        return null;
    }
};

export const getArtistsDetails = async (artistIds) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    const chunks = [];
    for (let i = 0; i < artistIds.length; i += 50) {
        chunks.push(artistIds.slice(i, i + 50));
    }

    const allArtists = [];
    try {
        for (const chunk of chunks) {
            const response = await fetch(`https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
                next: { revalidate: 3600 }
            });
            const data = await response.json();
            if (response.ok) allArtists.push(...data.artists);
        }
        return allArtists;
    } catch (e) {
        console.error("Spotify Artists Details Error:", e);
        return null;
    }
};
