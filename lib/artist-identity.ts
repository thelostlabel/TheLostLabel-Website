import prisma from "@/lib/prisma";

function normalizeIdentityValue(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function resolveArtistContextForUser(userId: string) {
  if (!userId) {
    return {
      user: null,
      artist: null,
      artistId: null,
      userEmail: null,
      normalizedNames: [] as string[],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          email: true,
          spotifyUrl: true,
          image: true,
          userId: true,
          monthlyListeners: true,
        },
      },
    },
  });

  const normalizedNames = Array.from(new Set(
    [user?.stageName, user?.fullName, user?.artist?.name]
      .map((value) => normalizeIdentityValue(value))
      .filter(Boolean)
  ));

  return {
    user,
    artist: user?.artist ?? null,
    artistId: user?.artist?.id ?? null,
    userEmail: user?.email ?? null,
    normalizedNames,
  };
}

export function buildArtistOwnedContractScope({
  userId,
  userEmail,
  artistId,
}: {
  userId?: string | null;
  userEmail?: string | null;
  artistId?: string | null;
}) {
  const scope = [];

  if (artistId) {
    scope.push({ artistId });
    scope.push({ splits: { some: { artistId } } });
  }

  if (userId) {
    scope.push({ userId });
    scope.push({ artist: { userId } });
    scope.push({ splits: { some: { userId } } });
  }

  if (userEmail) {
    scope.push({ primaryArtistEmail: userEmail });
    scope.push({ artist: { email: userEmail } });
    scope.push({ splits: { some: { email: userEmail } } });
    scope.push({ splits: { some: { user: { email: userEmail } } } });
  }

  return scope;
}
