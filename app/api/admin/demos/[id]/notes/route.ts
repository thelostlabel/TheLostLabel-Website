import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const demo = await prisma.demo.findUnique({
    where: { id },
    select: { internalNotes: true, rejectionReason: true },
  });

  if (!demo) {
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }

  return NextResponse.json({ notes: demo.internalNotes || "", rejectionReason: demo.rejectionReason || "" });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const notes = typeof body.notes === "string" ? body.notes : "";
  const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : undefined;

  const demo = await prisma.demo.findUnique({ where: { id } });
  if (!demo) {
    return NextResponse.json({ error: "Demo not found" }, { status: 404 });
  }

  const data: Record<string, string> = { internalNotes: notes };
  if (rejectionReason !== undefined) {
    data.rejectionReason = rejectionReason;
  }

  await prisma.demo.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true });
}
