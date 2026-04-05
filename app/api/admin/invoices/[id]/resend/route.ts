import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security";
import { sendMail } from "@/lib/mail";
import { generateInvoiceFormEmail } from "@/lib/mail-templates";

const SITE_URL = process.env.NEXTAUTH_URL || "https://thelostlabel.com";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError || accessUser?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "completed" || invoice.status === "paid" || invoice.status === "cancelled") {
      return NextResponse.json({ error: `Cannot resend invoice with status "${invoice.status}"` }, { status: 400 });
    }

    // Generate new token
    const token = generateOpaqueToken();
    const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.invoice.update({
      where: { id },
      data: {
        token: hashOpaqueToken(token),
        tokenExpiry,
        status: "pending",
        resendCount: { increment: 1 },
        lastResendAt: new Date(),
      },
    });

    const formLink = `${SITE_URL}/invoice/${token}`;
    await sendMail({
      to: invoice.recipientEmail,
      subject: `${invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : "Invoice Form"} - Please Complete Your Information`,
      html: generateInvoiceFormEmail(invoice.recipientName || invoice.recipientEmail, formLink),
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "invoice.resend",
          entity: "invoice",
          entityId: id,
          details: `Resent to ${invoice.recipientEmail} (count: ${(invoice.resendCount || 0) + 1})`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/invoices/[id]/resend POST]", error);
    return NextResponse.json({ error: "Failed to resend invoice" }, { status: 500 });
  }
}
