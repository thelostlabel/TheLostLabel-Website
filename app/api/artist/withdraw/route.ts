import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getArtistBalanceStats } from "@/lib/artist-balance";
import { withdrawBodySchema } from "@/lib/finance-schemas";
import { getErrorMessage, parseFloatInput } from "@/lib/finance-utils";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = withdrawBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const { amount, method, notes } = parsedBody.data;

    const parsedAmount = parseFloatInput(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const financialStats = await getArtistBalanceStats({ userId, userEmail });
    const availableBalance = financialStats.available;

    if (parsedAmount > availableBalance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: parsedAmount,
        currency: "USD",
        method: method || "BANK_TRANSFER",
        notes: notes ? `[ARTIST_REQUEST_NOTE] ${String(notes).trim()}` : "Withdrawal request",
        status: "pending",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Withdrawal Request Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
