import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                });
            }
        } catch (webhookError) {
            console.error("Webhook Error:", webhookError);
        }

        // --- EMAIL NOTIFICATION ---
        try {
            const { sendMail } = await import('@/lib/mail');
            const releaseName = updated.release?.name || 'Unknown Release';
            const statusColor = (status === 'approved' || status === 'completed') ? '#00ff88' :
                (status === 'rejected') ? '#ff4444' : '#ffaa00';

            await sendMail({
                to: updated.user.email,
                subject: `Request ${status.toUpperCase()} - ${releaseName}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Status Update</h2>
                        <p>Hello <strong>${updated.user.stageName || 'Artist'}</strong>,</p>
                        <p>Your request for <strong>${updated.type.toUpperCase().replace('_', ' ')}</strong> on <strong>${releaseName}</strong> has been updated to:</p>
                        <div style="padding: 15px; background: #f9f9f9; border-left: 4px solid ${statusColor}; margin: 20px 0;">
                            <h3 style="margin: 0; color: ${statusColor};">${status.toUpperCase()}</h3>
                        </div>
                        ${adminNote ? `
                        <div style="padding: 15px; background: #fffbe6; border: 1px solid #ffe58f; margin: 20px 0;">
                            <p style="margin: 0; font-size: 13px; color: #856404;"><strong>Admin Note:</strong></p>
                            <p style="margin: 5px 0 0 0; font-size: 14px;">${adminNote}</p>
                        </div>
                        ` : ''}
                        <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                            Best regards,<br>
                            <strong>LOST. Team</strong>
                        </p>
                    </div>
                `
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
