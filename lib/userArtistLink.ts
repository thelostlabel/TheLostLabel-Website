import type { Artist } from "@prisma/client";

import prisma from "@/lib/prisma";

type LinkedArtistReference = { id: string } | Artist;

export function normalizeArtistValue(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeEmailValue(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function matchesAnyNormalizedName(value: string | null | undefined, names: Set<string>): boolean {
  const normalized = normalizeArtistValue(value);
  return Boolean(normalized) && names.has(normalized);
}

async function syncUserContractsToArtist(user: { id: string; email: string; stageName: string | null; fullName: string | null }, artist: { id: string; name: string | null }) {
  const normalizedNames = new Set(
    [user.stageName, user.fullName, artist.name]
      .map((value) => normalizeArtistValue(value))
      .filter(Boolean)
  );
  const normalizedEmail = normalizeEmailValue(user.email);

  const duplicateArtists = await prisma.artist.findMany({
    where: {
      id: { not: artist.id },
      userId: null,
    },
    select: { id: true, name: true, email: true },
    take: 1000,
  });

  const duplicateArtistIds = duplicateArtists
    .filter((candidate) => normalizeEmailValue(candidate.email) === normalizedEmail || matchesAnyNormalizedName(candidate.name, normalizedNames))
    .map((candidate) => candidate.id);

  const contracts = await prisma.contract.findMany({
    where: {
      OR: [
        { artistId: artist.id },
        ...(duplicateArtistIds.length ? [{ artistId: { in: duplicateArtistIds } }] : []),
        { artistId: null },
      ],
    },
    select: {
      id: true,
      artistId: true,
      userId: true,
      primaryArtistName: true,
      primaryArtistEmail: true,
    },
  });

  const contractIdsToAttach = contracts
    .filter((contract) => {
      if (contract.artistId === artist.id) {
        return contract.userId !== user.id;
      }

      if (duplicateArtistIds.includes(contract.artistId || "")) {
        return true;
      }

      return (
        !contract.artistId &&
        (
          (normalizedEmail && normalizeEmailValue(contract.primaryArtistEmail) === normalizedEmail) ||
          matchesAnyNormalizedName(contract.primaryArtistName, normalizedNames)
        )
      );
    })
    .map((contract) => contract.id);

  const splits = await prisma.royaltySplit.findMany({
    where: {
      OR: [
        { artistId: artist.id },
        ...(duplicateArtistIds.length ? [{ artistId: { in: duplicateArtistIds } }] : []),
        { artistId: null },
      ],
    },
    select: {
      id: true,
      artistId: true,
      userId: true,
      name: true,
      email: true,
    },
  });

  const splitIdsToAttach = splits
    .filter((split) => {
      if (split.artistId === artist.id) {
        return split.userId !== user.id;
      }

      if (duplicateArtistIds.includes(split.artistId || "")) {
        return true;
      }

      return (
        !split.artistId &&
        (
          (normalizedEmail && normalizeEmailValue(split.email) === normalizedEmail) ||
          matchesAnyNormalizedName(split.name, normalizedNames)
        )
      );
    })
    .map((split) => split.id);

  await prisma.$transaction(async (tx) => {
    if (duplicateArtistIds.length) {
      await tx.contract.updateMany({
        where: { artistId: { in: duplicateArtistIds } },
        data: { artistId: artist.id, userId: user.id },
      });

      await tx.royaltySplit.updateMany({
        where: { artistId: { in: duplicateArtistIds } },
        data: { artistId: artist.id, userId: user.id },
      });
    }

    if (contractIdsToAttach.length) {
      await tx.contract.updateMany({
        where: { id: { in: contractIdsToAttach } },
        data: { artistId: artist.id, userId: user.id },
      });
    }

    if (splitIdsToAttach.length) {
      await tx.royaltySplit.updateMany({
        where: { id: { in: splitIdsToAttach } },
        data: { artistId: artist.id, userId: user.id },
      });
    }
  });
}

export async function linkUserToArtist(userId: string): Promise<LinkedArtistReference | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { artist: { select: { id: true, name: true } } },
    });

    if (!user) {
      console.log(`[LinkUtil] User ${userId} not found.`);
      return null;
    }

    const normalizedStageName = normalizeArtistValue(user.stageName);
    let linkedArtist = user.artist;

    if (!linkedArtist) {
      let artist = await prisma.artist.findFirst({
        where: {
          email: { equals: user.email, mode: "insensitive" },
          userId: null,
        },
      });

      if (!artist && user.stageName) {
        artist = await prisma.artist.findFirst({
          where: {
            name: {
              equals: user.stageName,
              mode: "insensitive",
            },
            userId: null,
          },
        });
      }

      if (!artist && normalizedStageName) {
        const candidates = await prisma.artist.findMany({
          where: { userId: null },
          select: { id: true, name: true, email: true },
          take: 500,
        });

        const matchedCandidate = candidates.find((candidate) => normalizeArtistValue(candidate.name) === normalizedStageName) || null;
        if (matchedCandidate) {
          artist = await prisma.artist.findUnique({
            where: { id: matchedCandidate.id },
          });
        }
      }

      if (artist) {
        console.log(`[LinkUtil] Found match for User ${user.email} -> Artist ${artist.name} (${artist.id})`);

        linkedArtist = await prisma.artist.update({
          where: { id: artist.id },
          data: { userId: user.id, ...(artist.email ? {} : { email: user.email }) },
          select: { id: true, name: true },
        });
      }
    }

    if (linkedArtist) {
      await syncUserContractsToArtist(
        {
          id: user.id,
          email: user.email,
          stageName: user.stageName ?? null,
          fullName: user.fullName ?? null,
        },
        linkedArtist
      );
      return linkedArtist;
    }

    console.log(`[LinkUtil] No matching Artist profile found for User ${user.email}`);
    return null;
  } catch (error) {
    console.error(`[LinkUtil] Error linking user ${userId}:`, error);
    return null;
  }
}
