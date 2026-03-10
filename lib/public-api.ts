import type { Artist, Release, ReleaseArtist } from "@prisma/client";

import { mapReleaseArtistsToSummary, parseReleaseArtistsJson } from "@/lib/release-artists";

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
> & {
  releaseArtists?: Pick<ReleaseArtist, "artistId" | "name">[];
};

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
  return parseReleaseArtistsJson(artistsJson).map((artist) => ({ name: artist.name || artist.artistId }));
}

export function mapPublicRelease(release: ReleaseRecord): PublicRelease {
  const artists =
    release.releaseArtists && release.releaseArtists.length > 0
      ? mapReleaseArtistsToSummary(release.releaseArtists).map((artist) => ({ name: artist.name }))
      : parseReleaseArtists(release.artistsJson);
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
