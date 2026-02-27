import { fetchJsonWithRetry } from "@/lib/fetch-utils";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const SPOTIFY_TIMEOUT_MS = 10000;
const RETRY_OPTIONS = {
    retries: 2,
    baseDelayMs: 300,
    maxDelayMs: 2500,
    jitter: 0.2
};

let cachedToken = null;
let tokenExpiry = 0;

const SPOTIFY_ARTIST_URL_REGEX = /(?:open\.spotify\.com\/artist\/|spotify:artist:)([A-Za-z0-9]{22})/i;

function normalizeArtistName(value = "") {
    return value
        .toString()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

export function extractSpotifyArtistId(value) {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const matched = trimmed.match(SPOTIFY_ARTIST_URL_REGEX);
    if (matched?.[1]) return matched[1];

    if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;
    return null;
}

const spotifyFetchJson = async (url, options = {}, context = 'Spotify API') => {
    return fetchJsonWithRetry(url, options, RETRY_OPTIONS, SPOTIFY_TIMEOUT_MS, context);
};

export const getAccessToken = async () => {
    if (!client_id || !client_secret) return null;

    if (cachedToken && Date.now() < tokenExpiry - 300000) {
        return { access_token: cachedToken };
    }

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    try {
        const { response, data } = await spotifyFetchJson(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ grant_type: 'client_credentials' }),
            cache: 'no-store'
        }, 'Spotify Auth');

        if (response.ok && data?.access_token) {
            cachedToken = data.access_token;
            tokenExpiry = Date.now() + ((data.expires_in || 3600) * 1000);
            return data;
        }

        console.error('Spotify Auth Failed:', data || response.status);
        return null;
    } catch (error) {
        console.error('Spotify Auth Error:', error);
        return null;
    }
};

export const getAlbum = async (id) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    try {
        const { response, data } = await spotifyFetchJson(`https://api.spotify.com/v1/albums/${id}?market=US`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            next: { revalidate: 3600 }
        }, 'Spotify Album');

        return response.ok ? data : null;
    } catch {
        return null;
    }
};

export const getTrack = async (id) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    try {
        const { response, data } = await spotifyFetchJson(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            next: { revalidate: 1800 }
        }, 'Spotify Track');

        return response.ok ? data : null;
    } catch {
        return null;
    }
};

export const getPlaylistTracks = async (playlistId) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return null;

    const allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    try {
        while (nextUrl) {
            const { response, data } = await spotifyFetchJson(nextUrl, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
                next: { revalidate: 3600 }
            }, 'Spotify Playlist Tracks');

            if (!response.ok || !data) break;

            if (Array.isArray(data.items)) {
                allTracks.push(...data.items);
            }

            nextUrl = data.next || null;
        }

        return allTracks;
    } catch (error) {
        console.error('Spotify Playlist Sync Error:', error);
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
            const { response, data } = await spotifyFetchJson(`https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
                next: { revalidate: 3600 }
            }, 'Spotify Artists Details');

            if (response.ok && Array.isArray(data?.artists)) {
                allArtists.push(...data.artists);
            }
        }

        return allArtists;
    } catch (e) {
        console.error('Spotify Artists Details Error:', e);
        return null;
    }
};

export const getArtistAlbums = async (artistId) => {
    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return [];

    try {
        const { response, data } = await spotifyFetchJson(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&limit=50`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            next: { revalidate: 3600 }
        }, 'Spotify Artist Albums');

        return response.ok && Array.isArray(data?.items) ? data.items : [];
    } catch (e) {
        console.error('Spotify Artist Albums Error:', e);
        return [];
    }
};

export const searchSpotifyArtists = async (query, { limit = 8, market = "US" } = {}) => {
    const term = typeof query === "string" ? query.trim() : "";
    if (!term) return [];

    const tokenData = await getAccessToken();
    if (!tokenData?.access_token) return [];

    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 8));
    const encodedTerm = encodeURIComponent(term);
    const url = `https://api.spotify.com/v1/search?q=${encodedTerm}&type=artist&limit=${safeLimit}${market ? `&market=${market}` : ""}`;

    try {
        const { response, data } = await spotifyFetchJson(url, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            cache: "no-store"
        }, "Spotify Artist Search");

        if (!response.ok || !Array.isArray(data?.artists?.items)) {
            return [];
        }

        return data.artists.items;
    } catch (error) {
        console.error("Spotify Artist Search Error:", error);
        return [];
    }
};

export const findBestSpotifyArtistMatch = async (stageName) => {
    const term = typeof stageName === "string" ? stageName.trim() : "";
    if (!term) return null;

    const artists = await searchSpotifyArtists(term, { limit: 10 });
    if (!artists.length) return null;

    const normalizedTerm = normalizeArtistName(term);
    const score = (artistName) => {
        const normalizedArtist = normalizeArtistName(artistName);
        if (!normalizedArtist || !normalizedTerm) return 0;
        if (normalizedArtist === normalizedTerm) return 1;
        if (normalizedArtist.startsWith(normalizedTerm) || normalizedTerm.startsWith(normalizedArtist)) return 0.8;
        if (normalizedArtist.includes(normalizedTerm) || normalizedTerm.includes(normalizedArtist)) return 0.65;
        return 0;
    };

    const ranked = artists
        .map((artist) => ({
            artist,
            score: score(artist?.name),
            followers: Number(artist?.followers?.total || 0)
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.followers - a.followers;
        });

    const best = ranked[0];
    if (!best || best.score < 0.65) {
        return null;
    }

    const artist = best.artist;
    return {
        id: artist.id,
        name: artist.name,
        spotifyUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
        image: artist.images?.[0]?.url || null,
        followers: Number(artist.followers?.total || 0),
        popularity: artist.popularity ?? null,
        confidence: best.score
    };
};
