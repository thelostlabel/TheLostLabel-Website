import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { earningsBulkBodySchema } from "@/lib/finance-schemas";
import { getErrorMessage, hasAdminOrArRole, parseFloatInput, parseIntegerInput } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasAdminOrArRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = earningsBulkBodySchema.safeParse(body);
    if (!parsedBody.success || !Array.isArray(parsedBody.data.earnings)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array." }, { status: 400 });
    }

    const results = [];
    const errors: Array<{ item: unknown; error: string }> = [];

    for (const item of parsedBody.data.earnings) {
      try {
        if (!item.contractId || !item.period || item.grossAmount === undefined) {
          errors.push({ item, error: "Missing required fields" });
          continue;
        }

        const contract = await prisma.contract.findUnique({
          where: { id: item.contractId },
        });

        if (!contract) {
          errors.push({ item, error: "Contract not found" });
          continue;
        }

        const grossAmount = parseFloatInput(item.grossAmount);
        const artistAmount = grossAmount * contract.artistShare;
        const labelAmount = grossAmount * contract.labelShare;

        const earning = await prisma.earning.create({
          data: {
            contractId: item.contractId,
            period: item.period,
            grossAmount,
            artistAmount,
            labelAmount,
            currency: item.currency || "USD",
            streams: item.streams !== undefined ? parseIntegerInput(item.streams) : null,
            source: item.source || "spotify",
          },
        });
        results.push(earning);
      } catch (error) {
        errors.push({ item, error: getErrorMessage(error) });
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
