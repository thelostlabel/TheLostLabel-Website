import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

        // 1. Calculate current balance (identical logic to stats/route.js)
        const [payments, splits] = await Promise.all([
            prisma.payment.findMany({
                where: { userId: userId, status: { in: ['completed', 'pending'] } },
                select: { amount: true }
            }),
            prisma.royaltySplit.findMany({
                where: {
                    OR: [
                        { userId: userId },
                        { email: userEmail }
                    ]
                },
                include: {
                    contract: {
                        select: {
                            earnings: {
                                select: {
                                    artistAmount: true
                                }
                            }
                        }
                    }
                }
            })
        ]);

        let totalEarnings = 0;
        splits.forEach(split => {
            const contract = split.contract;
            if (contract && contract.earnings) {
                contract.earnings.forEach(earning => {
                    const share = (earning.artistAmount * split.percentage) / 100;
                    totalEarnings += share;
                });
            }
        });

        const totalUsed = payments.reduce((sum, p) => sum + p.amount, 0);
        const availableBalance = totalEarnings - totalUsed;

        if (amount > availableBalance) {
            return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400 });
        }

        // 2. Create pending payment record
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
