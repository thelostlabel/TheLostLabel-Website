import type { Artist } from "@prisma/client";

import prisma from "@/lib/prisma";

type LinkedArtistReference = { id: string } | Artist;

function normalizeArtistValue(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function linkUserToArtist(userId: string): Promise<LinkedArtistReference | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { artist: { select: { id: true } } },
    });

    if (!user) {
      console.log(`[LinkUtil] User ${userId} not found.`);
      return null;
    }
    if (user.artist?.id) {
      return user.artist;
    }

    const normalizedStageName = normalizeArtistValue(user.stageName);

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

      const updatedArtist = await prisma.artist.update({
        where: { id: artist.id },
        data: { userId: user.id },
      });

      return updatedArtist;
    }

    console.log(`[LinkUtil] No matching Artist profile found for User ${user.email}`);
    return null;
  } catch (error) {
    console.error(`[LinkUtil] Error linking user ${userId}:`, error);
    return null;
  }
}
