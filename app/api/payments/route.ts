import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-errors";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import { paymentCreateBodySchema, paymentUpdateBodySchema } from "@/lib/finance-schemas";
import { hasAdminOrArRole, parseFloatInput } from "@/lib/finance-utils";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generatePayoutStatusEmail } from "@/lib/mail-templates";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { settleSideEffects } from "@/lib/async-effects";
import { logAuditEvent, getClientIp, getClientUserAgent } from "@/lib/audit-log";
import { resolveArtistContextForUser } from "@/lib/artist-identity";

const typedLogger = logger as {
  debug: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
};

const typedHandleApiError = handleApiError as (error: unknown, context?: string) => Response;
const typedInsertDiscordOutboxEvent = insertDiscordOutboxEvent as (
  eventType: string,
  payload: Record<string, unknown>,
  aggregateId?: string | null,
) => Promise<unknown>;
const typedQueueDiscordNotification = queueDiscordNotification as (
  userId: string,
  type: string,
  data: Record<string, unknown>,
) => Promise<unknown>;

async function resolvePaymentRecipient({
  userId,
  artistId,
}: {
  userId?: string | null;
  artistId?: string | null;
}) {
  if (artistId) {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: { select: { id: true, email: true, stageName: true, fullName: true } },
      },
    });
    if (artist) {
      return {
        artist,
        userId: artist.user?.id || userId || null,
      };
    }
  }

  if (userId) {
    const context = await resolveArtistContextForUser(userId);
    return {
      artist: context.artist,
      userId,
    };
  }

  return {
    artist: null,
    userId: null,
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const { role, id: userId } = session.user;
    const artistContext = await resolveArtistContextForUser(userId);
    typedLogger.debug("Fetching payments", { userRole: role, userId });
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });
    const where = hasAdminOrArRole(role)
      ? undefined
      : {
          OR: [
            { userId },
            ...(artistContext.artistId ? [{ artistId: artistContext.artistId }] : []),
            { artist: { userId } },
          ],
        };

    const [payments, total] = await Promise.all([
      hasAdminOrArRole(role)
        ? prisma.payment.findMany({
            include: {
              user: { select: { id: true, stageName: true, fullName: true, email: true } },
              artist: { select: { id: true, name: true, email: true, userId: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          })
        : prisma.payment.findMany({
            where,
            include: {
              user: { select: { id: true, stageName: true, fullName: true, email: true } },
              artist: { select: { id: true, name: true, email: true, userId: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
      prisma.payment.count({ where }),
    ]);

    typedLogger.debug("Payments fetched", { count: payments.length });
    return NextResponse.json({
      payments,
      pagination: buildOffsetPaginationMeta(total, page, limit),
    }, { status: 200 });
  } catch (error) {
    typedLogger.error("Failed to fetch payments", error);
    return typedHandleApiError(error, "GET /api/payments");
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsedBody = paymentCreateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { userId, artistId, amount, currency, method, reference, notes, status } = parsedBody.data;

    if ((!userId && !artistId) || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloatInput(amount);
    if (Number.isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const recipient = await resolvePaymentRecipient({ userId, artistId });
    if (!recipient.userId) {
      return NextResponse.json({ error: "Payment recipient must be linked to a user account." }, { status: 400 });
    }

    const resolvedStatus = status || "completed";
    const payment = await prisma.payment.create({
      data: {
        userId: recipient.userId,
        artistId: recipient.artist?.id || artistId || null,
        amount: parsedAmount,
        currency: currency || "USD",
        method: method ?? null,
        reference: reference ?? null,
        notes: notes ?? null,
        status: resolvedStatus,
        processedAt: resolvedStatus === "completed" ? new Date() : null,
      },
    });

    try {
      await typedInsertDiscordOutboxEvent(
        resolvedStatus === "completed" ? "payment_completed" : "payment_created",
        {
          paymentId: payment.id,
          userId: payment.userId,
          amount: Number(payment.amount || 0),
          currency: payment.currency,
          status: payment.status,
          method: payment.method || null,
        },
        payment.id,
      );
    } catch (outboxError) {
      typedLogger.error("Failed to enqueue payment outbox event", outboxError);
    }

    logAuditEvent({
      userId: session.user.id,
      action: "create",
      entity: "payment",
      entityId: payment.id,
      details: JSON.stringify({ amount: parsedAmount, currency: currency || "USD", recipientUserId: recipient.userId }),
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    typedLogger.error("Failed to create payment", error);
    return typedHandleApiError(error, "POST /api/payments");
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsedBody = paymentUpdateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const { id, userId, artistId, amount, method, reference, notes, status, adminNote } = parsedBody.data;
    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, stageName: true } },
        artist: { select: { id: true, name: true, email: true, userId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updateData: Prisma.PaymentUpdateInput = {};
    if (userId !== undefined || artistId !== undefined) {
      const recipient = await resolvePaymentRecipient({
        userId: userId ?? existing.userId,
        artistId: artistId ?? existing.artist?.id ?? null,
      });

      if (!recipient.userId) {
        return NextResponse.json({ error: "Payment recipient must be linked to a user account." }, { status: 400 });
      }

      updateData.user = { connect: { id: recipient.userId } };
      updateData.artist = recipient.artist?.id ? { connect: { id: recipient.artist.id } } : { disconnect: true };
    }
    if (amount !== undefined) {
      updateData.amount = parseFloatInput(amount);
    }
    if (method !== undefined) {
      updateData.method = method;
    }
    if (reference !== undefined) {
      updateData.reference = reference;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.processedAt = new Date();
      }
      if (status === "failed") {
        updateData.processedAt = null;
      }
    }

    if (adminNote && String(adminNote).trim()) {
      const stamp = new Date().toISOString();
      const noteBlock = `[ADMIN_DECISION_NOTE ${stamp}] ${String(adminNote).trim()}`;
      updateData.notes = [existing.notes, noteBlock].filter(Boolean).join("\n\n");
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    if (status && ["completed", "failed"].includes(status) && existing.status !== status) {
      try {
        await typedInsertDiscordOutboxEvent(
          status === "completed" ? "payment_completed" : "payment_failed",
          {
            paymentId: payment.id,
            userId: payment.userId,
            amount: Number(payment.amount || 0),
            currency: payment.currency,
            status: payment.status,
            method: payment.method || null,
          },
          payment.id,
        );
      } catch (outboxError) {
        typedLogger.error("Failed to enqueue payment status outbox event", outboxError);
      }
    }

    logAuditEvent({
      userId: session.user.id,
      action: status ? (status === "completed" ? "approve" : status === "failed" ? "reject" : "update") : "update",
      entity: "payment",
      entityId: id,
      details: JSON.stringify({ status: payment.status, amount: Number(payment.amount || 0) }),
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
    });

    if (status && ["completed", "failed"].includes(status) && existing.status !== status) {
      await settleSideEffects([
        {
          label: "payout-status-email",
          run: async () => {
            if (!existing.user?.email) return;
            await sendMail({
              to: existing.user.email,
              subject: `Payout ${status === "completed" ? "Approved" : "Rejected"} - LOST.`,
              html: generatePayoutStatusEmail(existing.user.stageName || "Artist", existing.amount, status, adminNote),
            });
          },
        },
        {
          label: "payout-status-discord",
          run: async () => {
            if (!existing.userId) return;
            await typedQueueDiscordNotification(existing.userId, DISCORD_NOTIFY_TYPES.PAYOUT_UPDATE, {
              artist: existing.user?.stageName || "Artist",
              amount: existing.amount,
              status,
              adminNote: adminNote || null,
            });
          },
        },
      ], 5000).catch((error) => {
        typedLogger.error("Failed payout status side effects", error);
      });
    }

    return NextResponse.json(payment, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    logAuditEvent({
      userId: session.user.id,
      action: "delete",
      entity: "payment",
      entityId: id,
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
