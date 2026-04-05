import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });

    // Build CSV
    const headers = [
      "Invoice Number",
      "Recipient Email",
      "Recipient Name",
      "Amount",
      "Currency",
      "Status",
      "Description",
      "Due Date",
      "Created",
      "Submitted",
      "Payment Date",
      "Payment Method",
      "Created By",
    ];

    const escCsv = (val: string | null | undefined) => {
      if (!val) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = invoices.map((inv) => [
      escCsv(inv.invoiceNumber),
      escCsv(inv.recipientEmail),
      escCsv(inv.recipientName),
      String(inv.amount),
      inv.currency,
      inv.status,
      escCsv(inv.description),
      inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "",
      inv.createdAt.toISOString().slice(0, 10),
      inv.submittedAt ? inv.submittedAt.toISOString().slice(0, 10) : "",
      inv.paymentDate ? inv.paymentDate.toISOString().slice(0, 10) : "",
      escCsv(inv.paymentMethod),
      escCsv(inv.creator?.fullName || inv.creator?.email),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[admin/invoices/export GET]", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
