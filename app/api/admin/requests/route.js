import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateSupportStatusEmail } from "@/lib/mail-templates";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { settleSideEffects } from "@/lib/async-effects";
import { createNotification } from "@/lib/notification-service";
import { buildDiscordWebhookPayload, sendDiscordWebhook } from "@/lib/discord-webhooks";
import { logAuditEvent, getClientIp } from "@/lib/audit-log";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });
        const [requests, total] = await Promise.all([
            prisma.changeRequest.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            stageName: true,
                            artist: {
                                select: {
                                    image: true
                                }
                            }
                        }
                    },
                    release: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            spotifyUrl: true
                        }
                    }
                },
                skip,
                take: limit
            }),
            prisma.changeRequest.count()
        ]);
        return new Response(JSON.stringify({
            requests,
            pagination: buildOffsetPaginationMeta(total, page, limit)
        }), { status: 200 });
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

        // --- AUDIT LOG ---
        logAuditEvent({
            userId: session.user.id,
            action: status === 'approved' || status === 'completed' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
            entity: 'request',
            entityId: id,
            details: JSON.stringify({
                status,
                type: updated.type,
                releaseName: updated.release?.name || null,
                adminNote: adminNote || null,
            }),
            ipAddress: getClientIp(req),
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

                await sendDiscordWebhook({
                    name: "DISCORD_WEBHOOK_URL",
                    url: webhookUrl
                }, buildDiscordWebhookPayload({ embeds: [embed] }), {
                    context: "ChangeRequest webhook"
                }).then((response) => {
                    if (!response.ok) {
                        console.error(`Webhook request failed with status ${response.status}`);
                    }
                });
            }
        } catch (webhookError) {
            console.error("Webhook Error:", webhookError);
        }

        // --- EMAIL NOTIFICATION ---
        const colors = {
            reviewing: 0xffaa00,
            processing: 0x00aaff,
            needs_action: 0xfff000,
            approved: 0x00ff88,
            completed: 0x00ff88,
            rejected: 0xff4444
        };
        const releaseName = updated.release?.name || 'Unknown Release';
        const requestType = updated.type.toUpperCase().replace("_", " ");

        await settleSideEffects([
            {
                label: "in-app-notification",
                run: () => createNotification({
                    userId: updated.userId,
                    type: "request_updated",
                    title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: `Your ${requestType} request${releaseName !== "General" ? ` for ${releaseName}` : ""} has been updated to ${status.toUpperCase()}.`,
                    link: `?view=my-requests`,
                }).catch((notifError) => {
                    console.error("In-app notification error:", notifError);
                })
            },
            {
                label: "support-status-email",
                run: () => sendMail({
                    to: updated.user.email,
                    subject: `Request ${status.toUpperCase()} - ${releaseName}`,
                    html: generateSupportStatusEmail(
                        updated.user.stageName || 'Artist',
                        updated.type,
                        status,
                        adminNote
                    )
                }).catch((emailError) => {
                    console.error("Email Error:", emailError);
                })
            },
            {
                label: "support-status-discord",
                run: () => queueDiscordNotification(updated.userId, DISCORD_NOTIFY_TYPES.SUPPORT_RESPONSE, {
                    title: `Support Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    description: `Your **${requestType}** request${releaseName !== "General" ? ` for **${releaseName}**` : ""} has been updated to **${status.toUpperCase()}**.${adminNote ? `\n\n**Admin Note:** ${adminNote}` : ""}`,
                    color: colors[status] || 0xcccccc,
                    fields: [
                        { name: "Type", value: requestType, inline: true },
                        { name: "Status", value: status.toUpperCase(), inline: true },
                        { name: "Release", value: releaseName, inline: true }
                    ],
                    footer: "LOST. Support"
                }).catch((dmError) => {
                    console.error("[Admin Requests PATCH] Failed to queue Discord DM notification:", dmError);
                })
            }
        ], 5000);
        // -----------------------

        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
