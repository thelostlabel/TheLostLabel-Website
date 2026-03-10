import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getArtistBalanceStats } from "@/lib/artist-balance";
import { adminArtistBalanceBodySchema } from "@/lib/finance-schemas";
import type { AdminArtistBalanceResponse } from "@/lib/finance-types";
import { getErrorMessage, hasAdminOrArRole, parseFloatInput } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const artistId = searchParams.get("artistId");
    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 });
    }

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            stageName: true,
            fullName: true,
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const stats = await getArtistBalanceStats({
      artistId: artist.id,
      userId: artist.user?.id ?? null,
      userEmail: artist.user?.email || artist.email || null,
    });

    const adjustments = await prisma.balanceAdjustment.findMany({
      where: { artistId: artist.id },
      include: {
        createdBy: { select: { id: true, email: true, stageName: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const response: AdminArtistBalanceResponse = {
      artist: {
        id: artist.id,
        name: artist.name,
        userId: artist.userId,
        email: artist.email || artist.user?.email || null,
      },
      stats,
      adjustments,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = adminArtistBalanceBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 });
    }

    const { artistId, amount, reason, currency = "USD" } = parsedBody.data;
    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 });
    }

    const parsedAmount = parseFloatInput(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: "amount must be a non-zero number" }, { status: 400 });
    }

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const adjustment = await prisma.balanceAdjustment.create({
      data: {
        artistId: artist.id,
        userId: artist.user?.id ?? null,
        amount: parsedAmount,
        currency,
        reason: reason ? String(reason).trim() : null,
        createdById: session.user.id,
      },
    });

    const stats = await getArtistBalanceStats({
      artistId: artist.id,
      userId: artist.user?.id ?? null,
      userEmail: artist.user?.email || artist.email || null,
    });

    return NextResponse.json(
      {
        success: true,
        adjustment,
        stats,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
