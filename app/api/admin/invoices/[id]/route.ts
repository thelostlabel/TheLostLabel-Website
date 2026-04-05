import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError || accessUser?.role !== "admin") return null;
  return session.user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        user: { select: { id: true, fullName: true, stageName: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("[admin/invoices/[id] GET]", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/invoices/[id] DELETE]", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
