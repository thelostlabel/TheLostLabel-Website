import type { Artist, Release } from "@prisma/client";

type ArtistRecord = Pick<
  Artist,
  "id" | "name" | "image" | "spotifyUrl" | "followers" | "monthlyListeners" | "genres" | "verified" | "lastSyncedAt"
>;

type ReleaseRecord = Pick<
  Release,
  | "id"
  | "name"
  | "baseTitle"
  | "versionName"
  | "artistName"
  | "image"
  | "spotifyUrl"
  | "previewUrl"
  | "releaseDate"
  | "popularity"
  | "streamCountText"
  | "artistsJson"
>;

export type ReleaseArtistSummary = {
  name: string;
};

export type PublicArtist = {
  id: string;
  name: string;
  image: string | null;
  spotify_url: string | null;
  followers: number;
  monthlyListeners: number;
  genres: string[];
  verified: boolean;
  lastSyncedAt: Date | null;
};

export type PublicRelease = {
  id: string;
  name: string;
  baseTitle: string | null;
  versionName: string | null;
  artist: string;
  image: string | null;
  spotify_url: string | null;
  preview_url: string | null;
  release_date: string | null;
  popularity: number | null;
  stream_count_text: string | null;
  artists: ReleaseArtistSummary[];
};

export function mapPublicArtist(artist: ArtistRecord): PublicArtist {
  return {
    id: artist.id,
    name: artist.name,
    image: artist.image,
    spotify_url: artist.spotifyUrl,
    followers: artist.followers ?? 0,
    monthlyListeners: artist.monthlyListeners ?? 0,
    genres: artist.genres ? artist.genres.split(",") : [],
    verified: artist.verified ?? false,
    lastSyncedAt: artist.lastSyncedAt ?? null,
  };
}

export function parseReleaseArtists(artistsJson: string | null): ReleaseArtistSummary[] {
  if (!artistsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(artistsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((artist): artist is ReleaseArtistSummary => {
      return typeof artist === "object" && artist !== null && typeof artist.name === "string";
    });
  } catch {
    return [];
  }
}

export function mapPublicRelease(release: ReleaseRecord): PublicRelease {
  const artists = parseReleaseArtists(release.artistsJson);
  const artistName = artists.length > 0 ? artists.map((artist) => artist.name).join(", ") : (release.artistName ?? "Unknown Artist");

  return {
    id: release.id,
    name: release.name,
    baseTitle: release.baseTitle,
    versionName: release.versionName,
    artist: artistName,
    image: release.image,
    spotify_url: release.spotifyUrl,
    preview_url: release.previewUrl ?? null,
    release_date: release.releaseDate ?? null,
    popularity: release.popularity ?? null,
    stream_count_text: release.streamCountText ?? null,
    artists,
  };
}
