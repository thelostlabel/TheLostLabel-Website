import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/security";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const hashedToken = hashOpaqueToken(token);

    const invoice = await prisma.invoice.findFirst({
      where: {
        token: hashedToken,
        tokenExpiry: { gt: new Date() },
      },
      select: {
        id: true,
        invoiceNumber: true,
        recipientEmail: true,
        recipientName: true,
        amount: true,
        currency: true,
        description: true,
        formFields: true,
        status: true,
        tokenExpiry: true,
        viewedAt: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (invoice.status === "completed" || invoice.status === "paid") {
      return NextResponse.json({ error: "This invoice has already been submitted" }, { status: 400 });
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "This invoice has been cancelled" }, { status: 400 });
    }

    let formFields = [];
    try {
      formFields = JSON.parse(invoice.formFields);
    } catch {
      return NextResponse.json({ error: "Invalid form configuration" }, { status: 500 });
    }

    // Mark as viewed if first time
    if (!invoice.viewedAt) {
      await prisma.invoice.updateMany({
        where: { id: invoice.id, viewedAt: null },
        data: {
          viewedAt: new Date(),
          status: invoice.status === "pending" ? "viewed" : undefined,
        },
      });
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        recipientName: invoice.recipientName,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        formFields,
        status: invoice.status,
        tokenExpiry: invoice.tokenExpiry,
      },
    });
  } catch (error) {
    console.error("[invoices/[token] GET]", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
