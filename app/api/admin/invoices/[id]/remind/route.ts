import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateInvoiceReminderEmail } from "@/lib/mail-templates";

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
      return NextResponse.json({ error: `Cannot remind for invoice with status "${invoice.status}"` }, { status: 400 });
    }

    if (!invoice.token || !invoice.tokenExpiry || invoice.tokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invoice link has expired. Resend the invoice to generate a new link." }, { status: 400 });
    }

    const daysLeft = Math.ceil((invoice.tokenExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    await sendMail({
      to: invoice.recipientEmail,
      subject: `Reminder: ${invoice.invoiceNumber || "Invoice"} - Action Required`,
      html: generateInvoiceReminderEmail(
        invoice.recipientName || invoice.recipientEmail,
        invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
        daysLeft,
      ),
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "invoice.remind",
          entity: "invoice",
          entityId: id,
          details: `Sent reminder to ${invoice.recipientEmail}`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/invoices/[id]/remind POST]", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}
