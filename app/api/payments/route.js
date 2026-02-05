import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch payments
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        console.log("--- DEBUG: Fetching Payments ---");
        const { role, id: userId } = session.user;
        console.log("User Role:", role, "ID:", userId);
        let payments;

        if (role === 'admin' || role === 'a&r') {
            payments = await prisma.payment.findMany({
                include: {
                    user: { select: { id: true, stageName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            payments = await prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
        }
        console.log(`--- DEBUG: Found ${payments.length} payments ---`);
        return new Response(JSON.stringify({ payments }), { status: 200 });
    } catch (error) {
        console.error("--- DEBUG: GET /api/payments ERROR ---");
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create payment record (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId, amount, currency, method, reference, notes, status } = body;

        if (!userId || amount === undefined) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const payment = await prisma.payment.create({
            data: {
                userId,
                amount: parseFloat(amount),
                currency: currency || 'USD',
                method,
                reference,
                notes,
                status: status || 'completed',
                processedAt: status === 'completed' ? new Date() : null
            }
        });

        // Optional: Update earnings as "paid" if there are specific earnings linked? 
        // For simplicity, payments are aggregate.

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
