import type { Prisma, ReleaseArtist } from "@prisma/client";

export type ParsedReleaseArtist = {
  artistId: string;
  name: string | null;
};

type RawReleaseArtist =
  | string
  | null
  | undefined
  | {
      id?: string | null;
      artistId?: string | null;
      name?: string | null;
    };

export const RELEASE_ARTIST_SELECT = {
  artistId: true,
  name: true,
} satisfies Prisma.ReleaseArtistSelect;

export function normalizeReleaseArtistKey(value: string | null | undefined, fallbackName?: string | null) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";
  if (trimmedValue) {
    return trimmedValue;
  }

  const trimmedName = typeof fallbackName === "string" ? fallbackName.trim() : "";
  if (!trimmedName) {
    return null;
  }

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `name:${slug || "unknown"}`;
}

export function parseReleaseArtistsJson(artistsJson: string | null | undefined): ParsedReleaseArtist[] {
  if (!artistsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(artistsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeReleaseArtists(parsed as RawReleaseArtist[]);
  } catch {
    return [];
  }
}

export function normalizeReleaseArtists(artists: RawReleaseArtist[] | null | undefined): ParsedReleaseArtist[] {
  if (!Array.isArray(artists)) {
    return [];
  }

  const deduped = new Map<string, ParsedReleaseArtist>();

  for (const artist of artists) {
    if (typeof artist === "string") {
      const artistId = normalizeReleaseArtistKey(artist, artist);
      if (artistId && !deduped.has(artistId)) {
        deduped.set(artistId, { artistId, name: artist.trim() || null });
      }
      continue;
    }

    const name = typeof artist?.name === "string" ? artist.name.trim() : "";
    const artistId = normalizeReleaseArtistKey(artist?.id ?? artist?.artistId, name);
    if (!artistId || deduped.has(artistId)) {
      continue;
    }

    deduped.set(artistId, {
      artistId,
      name: name || null,
    });
  }

  return Array.from(deduped.values());
}

export function buildReleaseArtistNestedWrite(artistsJson: string | null | undefined) {
  const releaseArtists = parseReleaseArtistsJson(artistsJson);
  return {
    deleteMany: {},
    ...(releaseArtists.length > 0
      ? {
          create: releaseArtists.map((artist) => ({
            artistId: artist.artistId,
            name: artist.name,
          })),
        }
      : {}),
  };
}

export function mapReleaseArtistsToSummary(releaseArtists: Pick<ReleaseArtist, "artistId" | "name">[] | null | undefined) {
  return (releaseArtists || []).map((artist) => ({
    id: artist.artistId,
    name: artist.name || artist.artistId,
  }));
}

export function hasExactReleaseArtist(
  releaseArtists: Pick<ReleaseArtist, "artistId">[] | null | undefined,
  artistId: string | null | undefined,
) {
  if (!artistId) {
    return false;
  }

  return (releaseArtists || []).some((artist) => artist.artistId === artistId);
}

export function getReleaseArtistWhereById(artistId: string | null | undefined): Prisma.ReleaseWhereInput | null {
  if (!artistId) {
    return null;
  }

  return {
    releaseArtists: {
      some: { artistId },
    },
  };
}

export function getReleaseArtistWhereByName(name: string | null | undefined): Prisma.ReleaseWhereInput | null {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return null;
  }

  return {
    releaseArtists: {
      some: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    },
  };
}
