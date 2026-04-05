import prisma from "@/lib/prisma";

export const demoFileSelect = {
  id: true,
  filename: true,
  filepath: true,
  filesize: true,
  createdAt: true,
} as const;

export const demoArtistUserSelect = {
  id: true,
  email: true,
  stageName: true,
  fullName: true,
  role: true,
  spotifyUrl: true,
  artist: {
    select: {
      id: true,
      name: true,
      image: true,
      spotifyUrl: true,
      monthlyListeners: true,
    },
  },
} as const;

export const demoListSelect = {
  id: true,
  title: true,
  genre: true,
  trackLink: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  artistId: true,
  artistProfileId: true,
  reviewedAt: true,
  reviewedBy: true,
  rejectionReason: true,
  artistNote: true,
  scheduledReleaseDate: true,
  featuredArtists: true,
  artist: {
    select: {
      stageName: true,
      email: true,
    },
  },
  files: {
    select: demoFileSelect,
  },
} as const;

export const demoDetailSelect = {
  ...demoListSelect,
  artist: {
    select: demoArtistUserSelect,
  },
  contract: {
    select: {
      id: true,
      title: true,
      status: true,
      releaseId: true,
      artistId: true,
      userId: true,
      artistShare: true,
      labelShare: true,
      createdAt: true,
      notes: true,
      pdfUrl: true,
      featuredArtists: true,
      release: {
        select: {
          id: true,
          name: true,
          image: true,
          spotifyUrl: true,
          releaseDate: true,
          artistsJson: true,
        },
      },
      splits: {
        select: {
          id: true,
          userId: true,
          artistId: true,
          name: true,
          percentage: true,
          email: true,
        },
      },
    },
  },
} as const;

export const demoOwnerSelect = {
  id: true,
  artistId: true,
  artistProfileId: true,
} as const;

export const demoMutationResultSelect = {
  id: true,
  title: true,
  genre: true,
  trackLink: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  artistId: true,
  artistProfileId: true,
  reviewedAt: true,
  reviewedBy: true,
  rejectionReason: true,
  artistNote: true,
  scheduledReleaseDate: true,
  featuredArtists: true,
  artist: {
    select: demoArtistUserSelect,
  },
  contract: {
    select: {
      id: true,
      releaseId: true,
    },
  },
  files: {
    select: demoFileSelect,
  },
} as const;

let demoInternalNotesColumnPromise: Promise<boolean> | null = null;

export async function hasDemoInternalNotesColumn() {
  if (!demoInternalNotesColumnPromise) {
    demoInternalNotesColumnPromise = prisma
      .$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Demo'
            AND column_name = 'internalNotes'
        ) AS "exists"
      `
      .then((rows) => Boolean(rows[0]?.exists))
      .catch(() => false);
  }

  return demoInternalNotesColumnPromise;
}
