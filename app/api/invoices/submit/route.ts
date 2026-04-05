import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import prisma from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/security";
import { submitInvoiceSchema } from "@/lib/invoice-schemas";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { FormField } from "@/lib/invoice-schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, formData } = parsed.data;
    const hashedToken = hashOpaqueToken(token);

    const invoice = await prisma.invoice.findFirst({
      where: {
        token: hashedToken,
        tokenExpiry: { gt: new Date() },
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

    // Validate required fields
    let formFields: FormField[] = [];
    try {
      formFields = JSON.parse(invoice.formFields);
    } catch {
      return NextResponse.json({ error: "Invalid form configuration" }, { status: 500 });
    }

    const missingFields: string[] = [];
    for (const field of formFields) {
      if (field.required && (!formData[field.key] || !formData[field.key].trim())) {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf({
      invoiceId: invoice.invoiceNumber || invoice.id,
      recipientEmail: invoice.recipientEmail,
      recipientName: invoice.recipientName,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      formFields,
      formData,
      createdAt: invoice.createdAt,
      submittedAt: new Date(),
      dueDate: invoice.dueDate,
      documentLanguage: invoice.documentLanguage as "tr" | "en" | null | undefined,
    });

    // Save PDF
    const uploadsDir = join(process.cwd(), "private", "uploads", "invoices");
    await mkdir(uploadsDir, { recursive: true });
    const pdfPath = join(uploadsDir, `${invoice.id}.pdf`);
    await writeFile(pdfPath, pdfBuffer);

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        formData: JSON.stringify(formData),
        status: "completed",
        pdfUrl: pdfPath,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[invoices/submit POST]", error);
    return NextResponse.json({ error: "Failed to submit invoice" }, { status: 500 });
  }
}
