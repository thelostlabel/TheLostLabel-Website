import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  earningCreateBodySchema,
  earningsDeleteBodySchema,
} from "@/lib/finance-schemas";
import { buildArtistOwnedContractScope, resolveArtistContextForUser } from "@/lib/artist-identity";
import { getErrorMessage, hasAdminOrArRole, parseFloatInput, parseIntegerInput } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateEarningsNotificationEmail } from "@/lib/mail-templates";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { settleSideEffects } from "@/lib/async-effects";

type EarningRecipient = {
  email: string;
  userId: string | null;
  name: string;
  amount: number;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10) || 50;
    const skip = (page - 1) * limit;

    const { role, id: userId } = session.user;
    const whereClause: Prisma.EarningWhereInput = {};

    if (!hasAdminOrArRole(role)) {
      const artistContext = await resolveArtistContextForUser(userId);
      const contractScope: Prisma.ContractWhereInput[] = buildArtistOwnedContractScope({
        userId,
        userEmail: session.user.email,
        artistId: artistContext.artistId,
      });

      whereClause.contract = {
        OR: contractScope,
      };
    }

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where: whereClause,
        take: limit,
        skip,
        include: {
          contract: {
            include: {
              user: { select: { id: true, stageName: true, email: true } },
              release: true,
              splits: true,
              artist: true,
            },
          },
        },
        orderBy: { period: "desc" },
      }),
      prisma.earning.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        earnings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = earningsDeleteBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
    }

    const { artistId, userId, deleteType } = parsedBody.data;
    let whereClause: Prisma.EarningWhereInput = {};

    if (deleteType === "all_artist_earnings") {
      if (artistId) {
        whereClause = {
          contract: {
            OR: [{ artistId }, { userId }],
          },
        };
      } else if (userId) {
        whereClause = {
          contract: { userId },
        };
      } else {
        return NextResponse.json({ error: "Missing artistId or userId" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
    }

    if (artistId && !userId) {
      whereClause = {
        contract: { artistId },
      };
    }

    const deleted = await prisma.earning.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({ deletedCount: deleted.count }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = earningCreateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { contractId, period, grossAmount, currency, streams, source, expenseAmount } = parsedBody.data;

    if (!contractId || !period || grossAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        splits: {
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
        },
        user: { select: { id: true, email: true, stageName: true, fullName: true } },
        release: { select: { name: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const expenses = Number.isNaN(parseFloatInput(expenseAmount)) ? 0 : parseFloatInput(expenseAmount);
    const gross = parseFloatInput(grossAmount);

    const totalArtistPool = gross * contract.artistShare;
    const labelAmount = gross * contract.labelShare - expenses;

    const earning = await prisma.earning.create({
      data: {
        contractId,
        period,
        grossAmount: gross,
        expenseAmount: expenses,
        artistAmount: totalArtistPool,
        labelAmount,
        currency: currency || "USD",
        streams: streams !== undefined ? parseIntegerInput(streams) : null,
        source: source || "spotify",
      },
    });

    const recipients = new Map<string, EarningRecipient>();
    const releaseName = contract.release?.name || "Your Release";

    for (const split of contract.splits || []) {
      const recipientEmail = (split.user?.email || split.email || "").trim().toLowerCase();
      if (!recipientEmail) {
        continue;
      }

      const splitShare = (earning.artistAmount * Number(split.percentage || 0)) / 100;
      const existingRecipient = recipients.get(recipientEmail);

      if (existingRecipient) {
        existingRecipient.amount += splitShare;
        if (!existingRecipient.userId && split.user?.id) {
          existingRecipient.userId = split.user.id;
        }
      } else {
        recipients.set(recipientEmail, {
          email: recipientEmail,
          userId: split.user?.id || split.userId || null,
          name: split.user?.stageName || split.user?.fullName || split.name || "Artist",
          amount: splitShare,
        });
      }
    }

    const distributedAmount = Array.from(recipients.values()).reduce((sum, recipient) => sum + Number(recipient.amount || 0), 0);
    const remainingForPrimary = Math.max(0, Number(earning.artistAmount) - distributedAmount);

    const primaryEmail = (contract.user?.email || contract.primaryArtistEmail || "").trim().toLowerCase();
    if (primaryEmail && remainingForPrimary > 0) {
      const existingPrimary = recipients.get(primaryEmail);
      if (existingPrimary) {
        existingPrimary.amount += remainingForPrimary;
      } else {
        recipients.set(primaryEmail, {
          email: primaryEmail,
          userId: contract.user?.id || contract.userId || null,
          name: contract.user?.stageName || contract.user?.fullName || contract.primaryArtistName || "Artist",
          amount: remainingForPrimary,
        });
      }
    }

    await settleSideEffects(
      Array.from(recipients.values()).flatMap((recipient) => {
        const tasks: { label: string; run: () => Promise<unknown> }[] = [
          {
            label: `earnings-email:${recipient.email}`,
            run: () =>
              sendMail({
                to: recipient.email,
                subject: `NEW EARNINGS RECEIVED: ${releaseName}`,
                html: generateEarningsNotificationEmail(recipient.name, releaseName, recipient.amount, earning.period),
              }),
          },
        ];

        const recipientUserId = recipient.userId;
        if (recipientUserId) {
          tasks.push({
            label: `earnings-discord:${recipientUserId}`,
            run: async () => {
              await queueDiscordNotification(recipientUserId, DISCORD_NOTIFY_TYPES.EARNINGS_UPDATE, {
                title: "New Earnings Received 💰",
                description: `New earnings have been added for **${releaseName}**.`,
                color: 0x00ff88,
                fields: [
                  { name: "Release", value: releaseName, inline: true },
                  { name: "Period", value: earning.period, inline: true },
                  { name: "Your Share", value: `$${Number(recipient.amount || 0).toFixed(2)} ${earning.currency}`, inline: true },
                  { name: "Streams", value: earning.streams ? earning.streams.toLocaleString() : "N/A", inline: true },
                ],
                footer: "LOST. Earnings",
              });
            },
          });
        }

        return tasks;
      }),
      5000,
    ).catch((sideEffectError) => {
      console.error("[Earnings POST] Failed to dispatch side effects:", sideEffectError);
    });

    return NextResponse.json(earning, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
