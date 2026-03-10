import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiErrorResponse } from "@/types/api";
import type { UserProfilePatchInput, UserProfileResponse } from "@/types/profile";

const PROFILE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  legalName: true,
  phoneNumber: true,
  address: true,
  stageName: true,
  spotifyUrl: true,
  monthlyListeners: true,
  role: true,
  status: true,
  createdAt: true,
  notifyDemos: true,
  notifyEarnings: true,
  notifySupport: true,
  notifyContracts: true,
  discordNotifyEnabled: true,
  discordId: true,
  artist: {
    select: {
      id: true,
      name: true,
      image: true,
      spotifyUrl: true,
      monthlyListeners: true,
    },
  },
} satisfies Prisma.UserSelect;

const profilePatchSchema = z.object({
  email: z.string().optional(),
  fullName: z.string().nullable().optional(),
  legalName: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notifyDemos: z.boolean().optional(),
  notifyEarnings: z.boolean().optional(),
  notifySupport: z.boolean().optional(),
  notifyContracts: z.boolean().optional(),
  discordNotifyEnabled: z.boolean().optional(),
}).strict();

type ProfileRecord = Prisma.UserGetPayload<{
  select: typeof PROFILE_SELECT;
}>;

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error } satisfies ApiErrorResponse, { status });
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function mapProfile(user: ProfileRecord): UserProfileResponse {
  return {
    ...user,
    stageName: user.stageName || user.artist?.name || null,
    spotifyUrl: user.spotifyUrl || user.artist?.spotifyUrl || null,
    monthlyListeners: user.monthlyListeners ?? user.artist?.monthlyListeners ?? 0,
    artist: user.artist
      ? {
          id: user.artist.id,
          name: user.artist.name,
          image: user.artist.image || null,
          spotifyUrl: user.artist.spotifyUrl || null,
          monthlyListeners: user.artist.monthlyListeners ?? null,
        }
      : null,
    artistImage: user.artist?.image || null,
    discordLinked: Boolean(user.discordId),
  };
}

// GET: Fetch current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: PROFILE_SELECT,
    });

    if (!user) {
      return errorResponse(404, "User not found");
    }

    return NextResponse.json(mapProfile(user));
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

// PATCH: Update current user's profile
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = profilePatchSchema.safeParse(body);
    if (!parsedBody.success) {
      return errorResponse(400, "Invalid profile payload");
    }

    const data = parsedBody.data as UserProfilePatchInput;
    const requestedEmail = typeof data.email === "string" && data.email.trim()
      ? data.email.trim().toLowerCase()
      : null;
    const currentEmail = String(session.user.email || "").trim().toLowerCase();

    if (requestedEmail && requestedEmail !== currentEmail) {
      return errorResponse(400, "Email changes are not available from profile settings. Use the verification flow instead.");
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};
    if ("fullName" in data) dataToUpdate.fullName = normalizeOptionalString(data.fullName);
    if ("legalName" in data) dataToUpdate.legalName = normalizeOptionalString(data.legalName);
    if ("phoneNumber" in data) dataToUpdate.phoneNumber = normalizeOptionalString(data.phoneNumber);
    if ("address" in data) dataToUpdate.address = normalizeOptionalString(data.address);
    if ("notifyDemos" in data) dataToUpdate.notifyDemos = Boolean(data.notifyDemos);
    if ("notifyEarnings" in data) dataToUpdate.notifyEarnings = Boolean(data.notifyEarnings);
    if ("notifySupport" in data) dataToUpdate.notifySupport = Boolean(data.notifySupport);
    if ("notifyContracts" in data) dataToUpdate.notifyContracts = Boolean(data.notifyContracts);
    if ("discordNotifyEnabled" in data) dataToUpdate.discordNotifyEnabled = Boolean(data.discordNotifyEnabled);

    const user = Object.keys(dataToUpdate).length === 0
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: PROFILE_SELECT,
        })
      : await prisma.user.update({
          where: { id: session.user.id },
          data: dataToUpdate,
          select: PROFILE_SELECT,
        });

    if (!user) {
      return errorResponse(404, "User not found");
    }

    return NextResponse.json(mapProfile(user));
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
