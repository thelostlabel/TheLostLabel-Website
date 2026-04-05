import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { recipientEmail: session.user.email ?? "" },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true,
        submittedAt: true,
        paymentDate: true,
        pdfUrl: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        ...inv,
        hasPdf: inv.status === "completed" || inv.status === "paid" || Boolean(inv.pdfUrl),
        pdfUrl: undefined,
      })),
    });
  } catch (error) {
    console.error("[artist/invoices GET]", error);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
