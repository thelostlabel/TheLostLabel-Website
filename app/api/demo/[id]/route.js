import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateDemoApprovalEmail, generateDemoRejectionEmail } from "@/lib/mail-templates";
import { notifyDemoApproval } from "@/lib/discord";
import { randomUUID } from "crypto";

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

        const isAdminOrAR = session.user.role === 'admin' || session.user.role === 'a&r';
        const isOwner = demo.artistId === session.user.id;
        if (!isAdminOrAR && !isOwner) {
            return new Response("Forbidden", { status: 403 });
        }

        return new Response(JSON.stringify(demo), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    const isAdminOrAR = session?.user?.role === 'admin' || session?.user?.role === 'a&r';

    if (!session || !isAdminOrAR) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, finalizeData } = body;

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

    const isOwner = existingDemo.artistId === session.user.id;

    if (!isAdminOrAR && !isOwner) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Artists can only update assets and scheduled date, not status
    if (!isAdminOrAR && isOwner) {
        if (status) return new Response(JSON.stringify({ error: "Only admins can change status" }), { status: 403 });
    }

    try {
        const updateData = {};

        if (isAdminOrAR) {
            if (status) {
                updateData.status = status;
                updateData.reviewedBy = session.user.email;
                updateData.reviewedAt = new Date();
            }
            if (rejectionReason) updateData.rejectionReason = rejectionReason;
        }

        // Phase 5: Scheduling / Assets
        if (body.scheduledReleaseDate) {
            updateData.scheduledReleaseDate = body.scheduledReleaseDate;
        }

        const updatedDemo = await prisma.$transaction(async (tx) => {
            // NEW: If "Finalize & Send Contract" was clicked
            if (isAdminOrAR && finalizeData) {
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
                                artistsJson: JSON.stringify([{ id: d.artist.id, name: d.artist.stageName || d.artist.fullName }])
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

        // If status changed to approved, we might want to notify
        if ((status === 'approved' || status === 'contract_sent') && updatedDemo.artist?.email) {
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
                status === 'contract_sent' ? "Contract Sent" : "Pending Deal Configuration"
            );
        }

        // If status changed to rejected, notify artist
        if (status === 'rejected' && updatedDemo.artist?.email) {
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
    if (!session || session.user.role !== 'admin') {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.demo.delete({
            where: { id }
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
