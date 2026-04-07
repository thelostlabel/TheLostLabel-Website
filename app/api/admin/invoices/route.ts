import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { createInvoiceSchema, updateInvoiceSchema, generateInvoiceNumber } from "@/lib/invoice-schemas";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security";
import { sendMail } from "@/lib/mail";
import { renderEmailTemplate } from "@/lib/email-template-service";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";

const SITE_URL = process.env.NEXTAUTH_URL || "https://thelostlabel.com";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError || accessUser?.role !== "admin") return null;
  return session.user;
}

async function logAudit(userId: string, action: string, entityId: string, details?: string) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity: "invoice", entityId, details },
    });
  } catch (e) {
    console.error("[audit log]", e);
  }
}

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total, stats] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          creator: { select: { id: true, fullName: true, email: true } },
          user: { select: { id: true, fullName: true, stageName: true, email: true } },
        },
      }),
      prisma.invoice.count({ where }),
      // Aggregate stats
      prisma.invoice.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    // Build stats summary
    const summary = {
      total: 0,
      totalAmount: 0,
      pending: 0,
      pendingAmount: 0,
      completed: 0,
      completedAmount: 0,
      paid: 0,
      paidAmount: 0,
      overdue: 0,
      overdueAmount: 0,
    };

    for (const stat of stats) {
      const count = stat._count.id;
      const amount = stat._sum.amount || 0;
      summary.total += count;
      summary.totalAmount += amount;
      if (stat.status === "pending" || stat.status === "draft" || stat.status === "viewed") {
        summary.pending += count;
        summary.pendingAmount += amount;
      } else if (stat.status === "completed") {
        summary.completed += count;
        summary.completedAmount += amount;
      } else if (stat.status === "paid") {
        summary.paid += count;
        summary.paidAmount += amount;
      } else if (stat.status === "overdue") {
        summary.overdue += count;
        summary.overdueAmount += amount;
      }
    }

    return NextResponse.json({
      invoices,
      summary,
      pagination: buildOffsetPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[admin/invoices GET]", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { recipientEmail, recipientName, documentLanguage, amount, currency, description, formFields, userId, dueDate, notes, sendEmail } = parsed.data;

    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Generate sequential invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    let sequence = 1;
    if (lastInvoice?.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const invoiceNumber = generateInvoiceNumber(sequence);

    const token = generateOpaqueToken();
    const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        recipientEmail,
        recipientName: recipientName || null,
        documentLanguage,
        amount: numericAmount,
        currency,
        description: description || null,
        formFields: JSON.stringify(formFields),
        token: hashOpaqueToken(token),
        tokenExpiry,
        status: sendEmail ? "pending" : "draft",
        createdBy: user.id,
        userId: userId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
    });

    // Send email if requested
    if (sendEmail) {
      const formLink = `${SITE_URL}/invoice/${token}`;
      try {
        const rendered = await renderEmailTemplate("invoice-form", {
          recipientName: recipientName || recipientEmail,
          formLink,
          invoiceNumber,
        });
        if (rendered) {
          await sendMail({
            to: recipientEmail,
            subject: rendered.subject,
            html: rendered.body,
          });
        }
      } catch (mailError) {
        console.error("[admin/invoices POST] Email send failed:", mailError);
      }
    }

    await logAudit(user.id, "invoice.create", invoice.id, `Created invoice ${invoiceNumber} for ${recipientEmail} — ${numericAmount} ${currency}`);

    return NextResponse.json({ invoice, token }, { status: 201 });
  } catch (error) {
    console.error("[admin/invoices POST]", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Build update data
    const data: Record<string, unknown> = {};

    // Only allow editing recipient/amount/fields if not yet submitted
    if (existing.status === "pending" || existing.status === "draft" || existing.status === "viewed") {
      if (updates.recipientEmail !== undefined) data.recipientEmail = updates.recipientEmail;
      if (updates.recipientName !== undefined) data.recipientName = updates.recipientName;
      if (updates.documentLanguage !== undefined) data.documentLanguage = updates.documentLanguage;
      if (updates.amount !== undefined) {
        const amt = typeof updates.amount === "string" ? parseFloat(updates.amount) : updates.amount;
        if (Number.isFinite(amt) && amt > 0) data.amount = amt;
      }
      if (updates.currency !== undefined) data.currency = updates.currency;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.formFields !== undefined) data.formFields = JSON.stringify(updates.formFields);
    }

    // These can be updated anytime
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.paymentMethod !== undefined) data.paymentMethod = updates.paymentMethod;
    if (updates.paymentRef !== undefined) data.paymentRef = updates.paymentRef;

    // Status changes
    if (updates.status !== undefined && updates.status !== existing.status) {
      data.status = updates.status;

      if (updates.status === "paid") {
        data.paymentDate = new Date();
      }
      if (updates.status === "cancelled") {
        data.token = null;
        data.tokenExpiry = null;
      }
    }

    const updated = await prisma.invoice.update({ where: { id }, data });

    const changes: string[] = [];
    if (updates.status) changes.push(`status → ${updates.status}`);
    if (updates.amount) changes.push(`amount → ${updates.amount}`);
    if (updates.recipientEmail) changes.push(`email → ${updates.recipientEmail}`);
    await logAudit(user.id, "invoice.update", id, changes.join(", ") || "Updated invoice");

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error("[admin/invoices PATCH]", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
