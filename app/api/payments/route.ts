import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-errors";
import { paymentCreateBodySchema, paymentUpdateBodySchema } from "@/lib/finance-schemas";
import { hasAdminOrArRole, parseFloatInput } from "@/lib/finance-utils";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generatePayoutStatusEmail } from "@/lib/mail-templates";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";

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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role, id: userId } = session.user;
    typedLogger.debug("Fetching payments", { userRole: role, userId });

    const payments = hasAdminOrArRole(role)
      ? await prisma.payment.findMany({
          include: {
            user: { select: { id: true, stageName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

    typedLogger.debug("Payments fetched", { count: payments.length });
    return NextResponse.json({ payments }, { status: 200 });
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
    const body = await req.json().catch(() => null);
    const parsedBody = paymentCreateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { userId, amount, currency, method, reference, notes, status } = parsedBody.data;

    if (!userId || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloatInput(amount);
    if (Number.isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const resolvedStatus = status || "completed";
    const payment = await prisma.payment.create({
      data: {
        userId,
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
    const body = await req.json().catch(() => null);
    const parsedBody = paymentUpdateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const { id, amount, method, reference, notes, status, adminNote } = parsedBody.data;
    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, stageName: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updateData: Prisma.PaymentUpdateInput = {};
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

    if (status && ["completed", "failed"].includes(status) && existing.status !== status) {
      try {
        if (existing.user?.email) {
          await sendMail({
            to: existing.user.email,
            subject: `Payout ${status === "completed" ? "Approved" : "Rejected"} - LOST.`,
            html: generatePayoutStatusEmail(existing.user.stageName || "Artist", existing.amount, status, adminNote),
          });
        }
      } catch (emailError) {
        typedLogger.error("Failed to send payout status email", emailError);
      }

      try {
        if (existing.userId) {
          await typedQueueDiscordNotification(existing.userId, DISCORD_NOTIFY_TYPES.PAYOUT_UPDATE, {
            artist: existing.user?.stageName || "Artist",
            amount: existing.amount,
            status,
            adminNote: adminNote || null,
          });
        }
      } catch (dmError) {
        typedLogger.error("Failed to send payout Discord DM", dmError);
      }
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
