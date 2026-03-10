import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { earningUpdateBodySchema } from "@/lib/finance-schemas";
import { getErrorMessage, hasAdminOrArRole, parseFloatInput, parseIntegerInput } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";

type EarningRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: Request, { params }: EarningRouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.earning.delete({
      where: { id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete Earning Error:", error);
    return NextResponse.json({ error: "Failed to delete earning" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: EarningRouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = earningUpdateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Failed to update earning" }, { status: 500 });
    }

    const { grossAmount, expenseAmount, period, streams, source, contractId } = parsedBody.data;

    const currentEarning = await prisma.earning.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!currentEarning) {
      return NextResponse.json({ error: "Earning not found" }, { status: 404 });
    }

    const targetContractId = contractId || currentEarning.contractId;

    let contract = currentEarning.contract;
    if (contractId && contractId !== currentEarning.contractId) {
      const replacementContract = await prisma.contract.findUnique({ where: { id: contractId } });
      if (!replacementContract) {
        return NextResponse.json({ error: "New contract not found" }, { status: 404 });
      }
      contract = replacementContract;
    }

    const gross = grossAmount !== undefined ? parseFloatInput(grossAmount) : currentEarning.grossAmount;
    const expense = expenseAmount !== undefined ? parseFloatInput(expenseAmount) : currentEarning.expenseAmount;

    const artistAmount = gross * contract.artistShare;
    const labelAmount = gross * contract.labelShare - expense;

    const updated = await prisma.earning.update({
      where: { id },
      data: {
        contractId: targetContractId,
        period: period || currentEarning.period,
        grossAmount: gross,
        expenseAmount: expense,
        artistAmount,
        labelAmount,
        streams: streams !== undefined ? parseIntegerInput(streams) : currentEarning.streams,
        source: source || currentEarning.source,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Update Earning Error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update earning") }, { status: 500 });
  }
}
