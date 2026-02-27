import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getArtistBalanceStats } from "@/lib/artist-balance";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const userId = session.user.id;
        const userEmail = session.user.email;
        const body = await req.json();
        const { amount, method, notes } = body;

        if (!amount || amount <= 0) {
            return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
        }

        const financialStats = await getArtistBalanceStats({ userId, userEmail });
        const availableBalance = financialStats.available;

        if (Number(amount) > availableBalance) {
            return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400 });
        }

        const payment = await prisma.payment.create({
            data: {
                userId,
                amount: parseFloat(amount),
                currency: 'USD',
                method: method || 'BANK_TRANSFER',
                notes: notes ? `[ARTIST_REQUEST_NOTE] ${String(notes).trim()}` : 'Withdrawal request',
                status: 'pending'
            }
        });

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (e) {
        console.error("Withdrawal Request Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
