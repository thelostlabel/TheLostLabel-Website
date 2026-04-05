import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { FormField } from "@/lib/invoice-schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const languageSuffix = invoice.documentLanguage === "tr" ? "-tr" : "-en";
    const filename = invoice.invoiceNumber
      ? `${invoice.invoiceNumber}${languageSuffix}.pdf`
      : `invoice-${invoice.id.slice(0, 8)}${languageSuffix}.pdf`;

    // If we already have a stored PDF, serve it
    if (invoice.pdfUrl) {
      try {
        const pdfBuffer = await readFile(invoice.pdfUrl);
        return new Response(new Uint8Array(pdfBuffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        });
      } catch {
        // PDF file missing, regenerate below
      }
    }

    if ((invoice.status !== "completed" && invoice.status !== "paid") || !invoice.formData) {
      return NextResponse.json({ error: "Invoice not yet submitted" }, { status: 400 });
    }

    let formFields: FormField[] = [];
    let formData: Record<string, string> = {};
    try {
      formFields = JSON.parse(invoice.formFields);
      formData = JSON.parse(invoice.formData);
    } catch {
      return NextResponse.json({ error: "Invalid invoice data" }, { status: 500 });
    }

    const pdfBuf = await generateInvoicePdf({
      invoiceId: invoice.invoiceNumber || invoice.id,
      recipientEmail: invoice.recipientEmail,
      recipientName: invoice.recipientName,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      formFields,
      formData,
      createdAt: invoice.createdAt,
      submittedAt: invoice.submittedAt,
      dueDate: invoice.dueDate,
      documentLanguage: invoice.documentLanguage as "tr" | "en" | null | undefined,
    });

    return new Response(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[admin/invoices/[id]/pdf GET]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
