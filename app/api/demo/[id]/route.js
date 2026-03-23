import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateDemoApprovalEmail, generateDemoRejectionEmail } from "@/lib/mail-templates";
import { notifyDemoApproval } from "@/lib/discord";
import {
    canApproveDemos,
    canDeleteDemos,
    canFinalizeDemos,
    canRejectDemos,
    canReviewDemos,
    canViewAllDemos,
    hasPortalPermission
} from "@/lib/permissions";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { resolveArtistContextForUser } from "@/lib/artist-identity";

const REVIEWABLE_STATUSES = new Set(["pending", "reviewing"]);

function normalizeReleaseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;

    try {
        const artistContext = await resolveArtistContextForUser(session.user.id);
        const demo = await prisma.demo.findUnique({
            where: { id },
            include: {
                artist: {
                    select: {
                        id: true,
                        email: true,
                        stageName: true,
                        fullName: true,
                        role: true
                    }
                },
                files: true,
                contract: {
                    include: {
                        release: true,
                        splits: true
                    }
                }
            }
        });

        if (!demo) {
            return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });
        }

        const canViewAll = canViewAllDemos(session.user);
        const isOwner = demo.artistId === session.user.id || (artistContext.artistId && demo.artistProfileId === artistContext.artistId);
        if (!canViewAll && !isOwner) {
            return new Response("Forbidden", { status: 403 });
        }
        if (isOwner && !hasPortalPermission(session.user, "view_demos")) {
            return new Response(JSON.stringify({ error: "You do not have permission to view demos." }), { status: 403 });
        }

        return new Response(JSON.stringify(demo), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, finalizeData } = body;
    const nextStatus = typeof status === "string" ? status.trim().toLowerCase() : null;
    const canViewAll = canViewAllDemos(session.user);
    const artistContext = await resolveArtistContextForUser(session.user.id);

    // Fetch existing demo to check ownership
    const existingDemo = await prisma.demo.findUnique({
        where: { id },
        include: {
            artist: {
                select: {
                    id: true,
                    email: true,
                    stageName: true,
                    fullName: true
                }
            }
        }
    });

    if (!existingDemo) {
        return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });
    }

    const isOwner = existingDemo.artistId === session.user.id || (artistContext.artistId && existingDemo.artistProfileId === artistContext.artistId);

    if (!canViewAll && !isOwner) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (isOwner && !hasPortalPermission(session.user, "view_demos")) {
        return new Response(JSON.stringify({ error: "You do not have permission to access this demo." }), { status: 403 });
    }

    const isStaffAction = canViewAll;

    // Artists can only update assets and scheduled date, not review state
    if (!isStaffAction && isOwner) {
        if (nextStatus || finalizeData || rejectionReason) {
            return new Response(JSON.stringify({ error: "Only staff can change review status" }), { status: 403 });
        }
    }

    if (isStaffAction) {
        if (nextStatus === "contract_sent") {
            return new Response(JSON.stringify({ error: "Contract stage is disabled." }), { status: 400 });
        }

        if (finalizeData) {
            return new Response(JSON.stringify({ error: "Contract finalization flow is disabled." }), { status: 400 });
        }

        if (nextStatus && REVIEWABLE_STATUSES.has(nextStatus) && !canReviewDemos(session.user)) {
            return new Response(JSON.stringify({ error: "You do not have permission to move demos through review." }), { status: 403 });
        }

        if (nextStatus === "approved" && !canApproveDemos(session.user) && !finalizeData) {
            return new Response(JSON.stringify({ error: "You do not have permission to approve demos." }), { status: 403 });
        }

        if (nextStatus === "rejected" && !canRejectDemos(session.user)) {
            return new Response(JSON.stringify({ error: "You do not have permission to reject demos." }), { status: 403 });
        }

        if ((nextStatus === "contract_sent" || finalizeData || body.scheduledReleaseDate || body.coverArtUrl) && !canFinalizeDemos(session.user)) {
            return new Response(JSON.stringify({ error: "You do not have permission to finalize demos." }), { status: 403 });
        }
    } else if ((body.scheduledReleaseDate || body.coverArtUrl) && !hasPortalPermission(session.user, "view_demos")) {
        return new Response(JSON.stringify({ error: "You do not have permission to update this demo." }), { status: 403 });
    }

    try {
        const updateData = {};

        if (isStaffAction) {
            if (nextStatus) {
                updateData.status = nextStatus;
                updateData.reviewedBy = session.user.email;
                updateData.reviewedAt = new Date();
            }
            if (rejectionReason) updateData.rejectionReason = rejectionReason;
        }

        // Artist note (owner can always update)
        if (typeof body.artistNote === "string" && isOwner) {
            updateData.artistNote = body.artistNote.slice(0, 2000);
        }

        // Phase 5: Scheduling / Assets
        if (body.scheduledReleaseDate) {
            updateData.scheduledReleaseDate = body.scheduledReleaseDate;
        }

        const updatedDemo = await prisma.demo.update({
            where: { id },
            data: updateData,
            include: { artist: true, contract: true }
        });
        const shouldNotifyStatusChange = Boolean(nextStatus || finalizeData);
        const notifiedStatus = shouldNotifyStatusChange && ["approved", "rejected"].includes(updatedDemo.status)
            ? updatedDemo.status
            : shouldNotifyStatusChange
                ? nextStatus
                : null;

        // If status changed to approved, we might want to notify
        if (notifiedStatus === 'approved' && updatedDemo.artist?.email) {
            try {
                await sendMail({
                    to: updatedDemo.artist.email,
                    subject: 'GOOD NEWS: YOUR DEMO HAS BEEN APPROVED',
                    html: generateDemoApprovalEmail(
                        updatedDemo.artist.stageName || updatedDemo.artist.fullName || "Artist",
                        updatedDemo.title
                    )
                });
            } catch (mailError) {
                console.error("Failed to send approval email:", mailError);
            }

            await notifyDemoApproval(
                updatedDemo.artist.stageName || updatedDemo.artist.fullName,
                updatedDemo.title,
                "Approved"
            );
        }

        if (notifiedStatus && ["approved", "rejected"].includes(notifiedStatus)) {
            try {
                await insertDiscordOutboxEvent(
                    notifiedStatus === "approved"
                        ? "demo_approved"
                        : "demo_rejected",
                    {
                        demoId: updatedDemo.id,
                        title: updatedDemo.title,
                        status: updatedDemo.status,
                        artistId: updatedDemo.artistId,
                        artistName: updatedDemo.artist?.stageName || updatedDemo.artist?.fullName || null,
                        rejectionReason: notifiedStatus === "rejected" ? rejectionReason || null : null
                    },
                    updatedDemo.id
                );
            } catch (outboxError) {
                console.error("[Demo PATCH] Failed to enqueue Discord outbox event:", outboxError);
            }

            // Queue Discord DM notification to the artist
            try {
                const artistName = updatedDemo.artist?.stageName || updatedDemo.artist?.fullName || "Artist";
                const notifyType = notifiedStatus === "rejected"
                    ? DISCORD_NOTIFY_TYPES.DEMO_REJECTED
                    : DISCORD_NOTIFY_TYPES.DEMO_APPROVED;

                const statusMeta = {
                    approved: { color: 0x00ff88, description: `Your demo **${updatedDemo.title}** has been approved! 🎉` },
                    rejected: { color: 0xff4444, description: `Your demo **${updatedDemo.title}** was not accepted.${rejectionReason ? `\n\n**Reason:** ${rejectionReason}` : ""}` }
                };

                await queueDiscordNotification(updatedDemo.artistId, notifyType, {
                    title: `Demo ${notifiedStatus.charAt(0).toUpperCase() + notifiedStatus.slice(1)}`,
                    description: statusMeta[notifiedStatus]?.description,
                    color: statusMeta[notifiedStatus]?.color ?? 0x7c3aed,
                    fields: [
                        { name: "Demo", value: updatedDemo.title, inline: true },
                        { name: "Artist", value: artistName, inline: true }
                    ],
                    footer: "LOST. Demo Review"
                });
            } catch (dmError) {
                console.error("[Demo PATCH] Failed to queue Discord DM notification:", dmError);
            }
        }

        // If status changed to rejected, notify artist
        if (notifiedStatus === 'rejected' && updatedDemo.artist?.email) {
            const userPrefs = await prisma.user.findUnique({
                where: { id: updatedDemo.artistId }, // artistId in Demo is UserId
                select: { notifyDemos: true }
            });

            if (userPrefs?.notifyDemos) {
                try {
                    await sendMail({
                        to: updatedDemo.artist.email,
                        subject: `Update on your demo: ${updatedDemo.title} | LOST.`,
                        html: generateDemoRejectionEmail(
                            updatedDemo.artist.stageName || updatedDemo.artist.fullName || "Artist",
                            updatedDemo.title,
                            rejectionReason
                        )
                    });
                } catch (mailError) {
                    console.error("Failed to send rejection email:", mailError);
                }
            }
        }

        return new Response(JSON.stringify(updatedDemo), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const demo = await prisma.demo.findUnique({ where: { id } });
        if (!demo) {
            return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });
        }

        const isAdmin = canDeleteDemos(session.user);
        const artistContext = await resolveArtistContextForUser(session.user.id);
        const isOwner = demo.artistId === session.user.id || (artistContext.artistId && demo.artistProfileId === artistContext.artistId);

        if (!isAdmin && !isOwner) {
            return new Response("Unauthorized", { status: 401 });
        }

        await prisma.demo.delete({
            where: { id }
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
