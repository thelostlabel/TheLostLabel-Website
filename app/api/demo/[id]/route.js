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
import { randomUUID } from "crypto";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";
import { queueDiscordNotification, DISCORD_NOTIFY_TYPES } from "@/lib/discord-notifications";
import { resolveArtistContextForUser } from "@/lib/artist-identity";
import { buildReleaseArtistNestedWrite } from "@/lib/release-artists";

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

        const updatedDemo = await prisma.$transaction(async (tx) => {
            // NEW: If "Finalize & Send Contract" was clicked
            if (isStaffAction && finalizeData) {
                const { releaseName, artistShare, labelShare, notes, contractPdf, splits, artistId: finalizedArtistId } = finalizeData;

                await tx.contract.create({
                    data: {
                        demoId: id,
                        artistId: finalizedArtistId || null, // Use the actual Artist Profile ID from frontend
                        userId: existingDemo.artistId, // existingDemo.artistId is the UserId in the Demo model
                        title: releaseName || existingDemo.title,
                        artistShare: parseFloat(artistShare) || 0.7,
                        labelShare: parseFloat(labelShare) || 0.3,
                        notes: notes || null,
                        pdfUrl: contractPdf || null,
                        status: 'active', // Active immediately, no signing needed per user request
                        splits: splits && Array.isArray(splits) ? {
                            create: splits.filter(s => s.name && s.percentage).map(s => ({
                                name: s.name,
                                email: s.email || null,
                                percentage: parseFloat(s.percentage),
                                userId: s.userId || null,
                                artistId: s.artistId || null
                            }))
                        } : undefined
                    }
                });

                updateData.status = 'contract_sent';
            }

            // 1. Update Demo
            const d = await tx.demo.update({
                where: { id },
                data: updateData,
                include: { artist: true, contract: true }
            });

            // 2. RELEASE CREATION LOGIC
            const releaseDateToUse = normalizeReleaseDate(body.scheduledReleaseDate || (finalizeData && finalizeData.releaseDate));

            // If we just finalized (created a contract) OR we are scheduling, ensure Release exists
            if (finalizeData || (body.scheduledReleaseDate && d.contract)) {
                // We need the contract ID. If we just created it, we can't easily get it from 'd.contract' 
                // reliably without re-fetching or using the created instance if we had explicitly captured it.
                // However, since we did `tx.demo.update` with `include: { contract: true }`, `d.contract` SHOULD be defined.

                if (d.contract) {
                    if (!d.contract.releaseId) {
                        const release = await tx.release.create({
                            data: {
                                id: `rel_${randomUUID()}`,
                                name: finalizeData?.releaseName || d.title, // Use explicit release name if provided
                                artistName: d.artist.stageName || d.artist.fullName,
                                image: body.coverArtUrl || null,
                                releaseDate: releaseDateToUse,
                                spotifyUrl: d.artist.spotifyUrl,
                                artistsJson: JSON.stringify([{ id: d.artist.id, name: d.artist.stageName || d.artist.fullName }]),
                                releaseArtists: buildReleaseArtistNestedWrite(
                                    JSON.stringify([{ id: d.artist.id, name: d.artist.stageName || d.artist.fullName }])
                                )
                            }
                        });

                        await tx.contract.update({
                            where: { id: d.contract.id },
                            data: { releaseId: release.id }
                        });
                    } else if (releaseDateToUse || body.coverArtUrl) {
                        // Update existing release
                        await tx.release.update({
                            where: { id: d.contract.releaseId },
                            data: {
                                ...(releaseDateToUse ? { releaseDate: releaseDateToUse } : {}),
                                ...(body.coverArtUrl ? { image: body.coverArtUrl } : {})
                            }
                        });
                    }
                }
            }
            return d;
        });
        const shouldNotifyStatusChange = Boolean(nextStatus || finalizeData);
        const notifiedStatus = shouldNotifyStatusChange && ["approved", "rejected", "contract_sent"].includes(updatedDemo.status)
            ? updatedDemo.status
            : shouldNotifyStatusChange
                ? nextStatus
                : null;

        // If status changed to approved, we might want to notify
        if ((notifiedStatus === 'approved' || notifiedStatus === 'contract_sent') && updatedDemo.artist?.email) {
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
                notifiedStatus === 'contract_sent' ? "Contract Sent" : "Pending Deal Configuration"
            );
        }

        if (notifiedStatus && ["approved", "rejected", "contract_sent"].includes(notifiedStatus)) {
            try {
                await insertDiscordOutboxEvent(
                    notifiedStatus === "approved"
                        ? "demo_approved"
                        : notifiedStatus === "rejected"
                            ? "demo_rejected"
                            : "demo_contract_sent",
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
                    : notifiedStatus === "contract_sent"
                        ? DISCORD_NOTIFY_TYPES.DEMO_CONTRACT_SENT
                        : DISCORD_NOTIFY_TYPES.DEMO_APPROVED;

                const statusMeta = {
                    approved: { color: 0x00ff88, description: `Your demo **${updatedDemo.title}** has been approved! 🎉` },
                    rejected: { color: 0xff4444, description: `Your demo **${updatedDemo.title}** was not accepted.${rejectionReason ? `\n\n**Reason:** ${rejectionReason}` : ""}` },
                    contract_sent: { color: 0x00aaff, description: `A contract has been sent for your demo **${updatedDemo.title}**. Please check your dashboard.` }
                };

                await queueDiscordNotification(updatedDemo.artistId, notifyType, {
                    title: `Demo ${notifiedStatus === "contract_sent" ? "Contract Sent" : notifiedStatus.charAt(0).toUpperCase() + notifiedStatus.slice(1)}`,
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
