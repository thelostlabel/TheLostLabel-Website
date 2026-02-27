import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateSupportStatusEmail } from "@/lib/mail-templates";
import { fetchWithRetry, fetchWithTimeout, isTransientStatus } from "@/lib/fetch-utils";

const WEBHOOK_TIMEOUT_MS = 10000;
const RETRY_OPTIONS = {
    retries: 2,
    baseDelayMs: 300,
    maxDelayMs: 2500,
    jitter: 0.2
};

const createTransientWebhookError = (status) => {
    const error = new Error(`ChangeRequest webhook transient status: ${status}`);
    error.isTransient = true;
    error.status = status;
    return error;
};

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const requests = await prisma.changeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, stageName: true } },
                release: true
            }
        });
        return new Response(JSON.stringify(requests), { status: 200 });
    } catch (e) {
        console.error("DEBUG API ERROR:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, adminNote, assignedToId } = body;

        const updated = await prisma.changeRequest.update({
            where: { id },
            data: {
                status,
                adminNote: adminNote !== undefined ? adminNote : undefined,
                assignedToId: assignedToId !== undefined ? assignedToId : undefined
            },
            include: {
                user: true,
                release: true,
                assignedTo: { select: { stageName: true, email: true } }
            }
        });

        // --- DISCORD WEBHOOK ---
        try {
            const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
            if (webhookUrl) {
                const colors = {
                    reviewing: 0xffaa00,  // Orange
                    processing: 0x00aaff, // Blue
                    needs_action: 0xfff000, // Yellow
                    approved: 0x00ff88,   // Green
                    completed: 0x00ff88,  // Green
                    rejected: 0xff4444    // Red
                };

                const fields = [
                    { name: "Release", value: updated.release?.name || "Unknown", inline: true },
                    { name: "Artist", value: updated.user?.stageName || "Unknown", inline: true },
                    { name: "Type", value: updated.type.toUpperCase().replace('_', ' '), inline: true },
                    { name: "Admin", value: session.user.email, inline: true }
                ];

                if (adminNote) {
                    fields.push({ name: "Admin Note", value: adminNote });
                }

                const embed = {
                    title: `CHANGE REQUEST ${status.toUpperCase()}`,
                    color: colors[status] || 0xcccccc,
                    fields,
                    footer: { text: "LOST. Admin Portal" },
                    timestamp: new Date().toISOString()
                };

                await fetchWithRetry(async () => {
                    const response = await fetchWithTimeout(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ embeds: [embed] })
                    }, WEBHOOK_TIMEOUT_MS);

                    if (isTransientStatus(response.status)) {
                        throw createTransientWebhookError(response.status);
                    }

                    if (!response.ok) {
                        console.error(`Webhook request failed with status ${response.status}`);
                    }

                    return response;
                }, RETRY_OPTIONS);
            }
        } catch (webhookError) {
            console.error("Webhook Error:", webhookError);
        }

        // --- EMAIL NOTIFICATION ---
        try {
            const releaseName = updated.release?.name || 'Unknown Release';

            await sendMail({
                to: updated.user.email,
                subject: `Request ${status.toUpperCase()} - ${releaseName}`,
                html: generateSupportStatusEmail(
                    updated.user.stageName || 'Artist',
                    updated.type,
                    status,
                    adminNote
                )
            });
        } catch (emailError) {
            console.error("Email Error:", emailError);
        }
        // -----------------------

        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
