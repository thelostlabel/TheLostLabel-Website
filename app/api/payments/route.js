import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-errors";
import { sendMail } from "@/lib/mail";
import { generatePayoutStatusEmail } from "@/lib/mail-templates";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";

// GET: Fetch payments
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { role, id: userId } = session.user;
        logger.debug('Fetching payments', { userRole: role, userId });
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
        logger.debug('Payments fetched', { count: payments.length });
        return new Response(JSON.stringify({ payments }), { status: 200 });
    } catch (error) {
        logger.error('Failed to fetch payments', error);
        return handleApiError(error, 'GET /api/payments');
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

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
        }

        const resolvedStatus = status || 'completed';
        const payment = await prisma.payment.create({
            data: {
                userId,
                amount: parsedAmount,
                currency: currency || 'USD',
                method,
                reference,
                notes,
                status: resolvedStatus,
                processedAt: resolvedStatus === 'completed' ? new Date() : null
            }
        });

        try {
            await insertDiscordOutboxEvent(
                resolvedStatus === "completed" ? "payment_completed" : "payment_created",
                {
                    paymentId: payment.id,
                    userId: payment.userId,
                    amount: Number(payment.amount || 0),
                    currency: payment.currency,
                    status: payment.status,
                    method: payment.method || null
                },
                payment.id
            );
        } catch (outboxError) {
            logger.error("Failed to enqueue payment outbox event", outboxError);
        }

        // Optional: Update earnings as "paid" if there are specific earnings linked? 
        // For simplicity, payments are aggregate.

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (error) {
        logger.error('Failed to create payment', error);
        return handleApiError(error, 'POST /api/payments');
    }
}
// PATCH: Update a payment (Admin only)
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, amount, method, reference, notes, status, adminNote } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing payment ID" }), { status: 400 });
        }

        const existing = await prisma.payment.findUnique({
            where: { id },
            include: {
                user: { select: { email: true, stageName: true } }
            }
        });

        if (!existing) {
            return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404 });
        }

        const updateData = {};
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (method !== undefined) updateData.method = method;
        if (reference !== undefined) updateData.reference = reference;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'completed') updateData.processedAt = new Date();
            if (status === 'failed') updateData.processedAt = null;
        }

        if (adminNote && String(adminNote).trim()) {
            const stamp = new Date().toISOString();
            const noteBlock = `[ADMIN_DECISION_NOTE ${stamp}] ${String(adminNote).trim()}`;
            updateData.notes = [existing.notes, noteBlock].filter(Boolean).join('\n\n');
        }

        const payment = await prisma.payment.update({
            where: { id },
            data: updateData
        });

        if (status && ["completed", "failed"].includes(status) && existing.status !== status) {
            try {
                await insertDiscordOutboxEvent(
                    status === "completed" ? "payment_completed" : "payment_failed",
                    {
                        paymentId: payment.id,
                        userId: payment.userId,
                        amount: Number(payment.amount || 0),
                        currency: payment.currency,
                        status: payment.status,
                        method: payment.method || null
                    },
                    payment.id
                );
            } catch (outboxError) {
                logger.error("Failed to enqueue payment status outbox event", outboxError);
            }
        }

        if (status && ['completed', 'failed'].includes(status) && existing.status !== status) {
            try {
                await sendMail({
                    to: existing.user.email,
                    subject: `Payout ${status === 'completed' ? 'Approved' : 'Rejected'} - LOST.`,
                    html: generatePayoutStatusEmail(
                        existing.user.stageName || 'Artist',
                        existing.amount,
                        status,
                        adminNote
                    )
                });
            } catch (emailError) {
                logger.error('Failed to send payout status email', emailError);
            }
        }

        return new Response(JSON.stringify(payment), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Remove a payment (Admin only)
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing payment ID" }), { status: 400 });
        }

        await prisma.payment.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
