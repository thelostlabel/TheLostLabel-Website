/**
 * POST /api/wise/payout
 * Admin-only: execute a pending Wise payout for a payment record.
 *
 * Body:
 *   paymentId     – Payment record ID to process
 *   recipientEmail – Wise account email of the artist
 *   recipientName  – Display name for the recipient
 *   currency       – Target currency (default: USD)
 *
 * On success: updates Payment status → "completed", stores Wise transfer ID as reference.
 */

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { executeWisePayout, getWiseProfileId } from "@/lib/wise";
import { sendMail } from "@/lib/mail";
import { generatePayoutStatusEmail } from "@/lib/mail-templates";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ar"].includes((session.user as { role?: string }).role ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, recipientEmail, recipientName, currency = "USD" } = body as {
      paymentId: string;
      recipientEmail: string;
      recipientName: string;
      currency?: string;
    };

    if (!paymentId || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: "paymentId, recipientEmail, and recipientName are required" },
        { status: 400 },
      );
    }

    // Load the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, email: true, stageName: true, fullName: true, notifyEarnings: true } },
        artist: { select: { id: true, name: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 409 },
      );
    }

    if (payment.method?.toLowerCase() !== "wise") {
      return NextResponse.json(
        { error: "Payment method is not Wise" },
        { status: 400 },
      );
    }

    // Execute the Wise payout
    const profileId = await getWiseProfileId();

    const { transferId, status: transferStatus } = await executeWisePayout({
      profileId,
      recipientEmail,
      recipientName,
      amount: Number(payment.amount),
      sourceCurrency: payment.currency ?? "USD",
      targetCurrency: currency,
      reference: `Label payout #${payment.id.slice(0, 8)}`,
      idempotencyKey: payment.id, // idempotent – same payment can't be double-sent
    });

    // Update payment record: mark completed, store transfer ID
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "completed",
        reference: `WISE-${transferId}`,
        processedAt: new Date(),
        notes: [
          payment.notes,
          `Wise transfer ${transferId} (${transferStatus}) – processed by ${(session.user as { email?: string }).email ?? "admin"}`,
        ]
          .filter(Boolean)
          .join("\n---\n"),
      },
    });

    // Send notification email to artist if they have an email
    const artistEmail = payment.user?.email;
    if (artistEmail && payment.user?.notifyEarnings !== false) {
      try {
        const emailHtml = (generatePayoutStatusEmail as (opts: {
          artistName: string;
          amount: number;
          currency: string;
          status: string;
          method: string;
          reference: string;
          note?: string;
        }) => string)({
          artistName: payment.user?.stageName ?? payment.user?.fullName ?? recipientName,
          amount: Number(payment.amount),
          currency: payment.currency ?? "USD",
          status: "completed",
          method: "Wise",
          reference: `WISE-${transferId}`,
          note: "Your payout has been sent via Wise. It typically arrives within 1–2 business days.",
        });

        await (sendMail as unknown as (opts: { to: string; subject: string; html: string }) => Promise<void>)({
          to: artistEmail,
          subject: "Your payout has been processed",
          html: emailHtml,
        });
      } catch {
        // Non-fatal – payout succeeded even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      transferId,
      transferStatus,
      paymentId: updated.id,
      reference: updated.reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/wise/payout?profileId=...
 * Returns Wise profile info – used by the admin UI to verify the integration is configured.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ar"].includes((session.user as { role?: string }).role ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.WISE_API_TOKEN) {
      return NextResponse.json({ configured: false, reason: "WISE_API_TOKEN not set" });
    }

    const { getWiseProfiles } = await import("@/lib/wise");
    const profiles = await getWiseProfiles();
    const profileId = process.env.WISE_PROFILE_ID
      ? Number(process.env.WISE_PROFILE_ID)
      : profiles.find((p) => p.type === "business")?.id ?? profiles[0]?.id;

    return NextResponse.json({
      configured: true,
      sandbox: process.env.WISE_SANDBOX === "true",
      profileId,
      profiles: profiles.map((p) => ({
        id: p.id,
        type: p.type,
        name: p.details.companyName ?? `${p.details.firstName} ${p.details.lastName}`,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ configured: false, error: message }, { status: 500 });
  }
}
