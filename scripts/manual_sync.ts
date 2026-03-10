import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });

type SpotifyTokenResponse = {
  access_token?: string;
  error?: string;
};

type SpotifyArtistRef = {
  id: string;
  name: string;
};

type SpotifyTrackPayload = {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album?: {
    images?: Array<{ url: string }>;
    release_date?: string;
  } | null;
  external_urls?: {
    spotify?: string;
  };
  popularity?: number;
  preview_url?: string | null;
};

type PlaylistTrackItem = {
  track?: SpotifyTrackPayload | null;
};

type SpotifyPlaylistPage = {
  items?: PlaylistTrackItem[];
  next?: string | null;
  error?: {
    message?: string;
  } | string;
};

type ReleaseUpsertPayload = {
  id: string;
  name: string;
  artistName: string | undefined;
  image: string | undefined;
  spotifyUrl: string | undefined;
  releaseDate: Date;
  artistsJson: string;
  popularity: number;
  previewUrl: string | null | undefined;
};

const prisma = new PrismaClient();
const PLAYLIST_ID = "6QHy5LPKDRHDdKZGBFxRY8";

function requireEnv(name: "SPOTIFY_CLIENT_ID" | "SPOTIFY_CLIENT_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function getAccessToken() {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");

  console.log("Getting access token...");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as SpotifyTokenResponse;
  if (data.error || !data.access_token) {
    throw new Error(data.error || "Failed to retrieve access token");
  }
  return data.access_token;
}

async function getPlaylistTracks(playlistId: string, accessToken: string) {
  const items: PlaylistTrackItem[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    console.log(`Fetching page: ${nextUrl}`);
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await response.json()) as SpotifyPlaylistPage;
    if (data.error) {
      console.error("Spotify API Error:", data.error);
      break;
    }
    items.push(...(data.items || []).filter((item) => item.track));
    nextUrl = data.next || null;
  }
  return items;
}

async function main() {
  try {
    const token = await getAccessToken();
    console.log("Token retrieved.");

    const items = await getPlaylistTracks(PLAYLIST_ID, token);
    console.log(`Found ${items.length} tracks.`);

    const playlistReleases = new Map<string, ReleaseUpsertPayload>();

    items.forEach((item) => {
      if (!item.track?.album) return;
      const track = item.track;
      const album = track.album;
      if (!album) return;

      if (!playlistReleases.has(track.id)) {
        playlistReleases.set(track.id, {
          id: track.id,
          name: track.name,
          artistName: track.artists[0]?.name,
          image: album.images?.[0]?.url,
          spotifyUrl: track.external_urls?.spotify,
          releaseDate: album.release_date ? new Date(album.release_date) : new Date(),
          artistsJson: JSON.stringify(track.artists.map((artist) => ({ id: artist.id, name: artist.name }))),
          popularity: track.popularity || 0,
          previewUrl: track.preview_url,
        });
      }
    });

    const releases = Array.from(playlistReleases.values());
    console.log(`Processing ${releases.length} unique releases...`);

    for (const release of releases) {
      await prisma.release.upsert({
        where: { id: release.id },
        update: {
          name: release.name,
          artistName: release.artistName,
          image: release.image,
          spotifyUrl: release.spotifyUrl,
          releaseDate: release.releaseDate.toISOString(),
          artistsJson: release.artistsJson,
          popularity: release.popularity,
          previewUrl: release.previewUrl,
        },
        create: {
          ...release,
          releaseDate: release.releaseDate.toISOString(),
        },
      });
    }

    console.log("Sync complete!");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
