import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { notifyDemoApproval } from "@/lib/discord";

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    const isAdminOrAR = session?.user?.role === 'admin' || session?.user?.role === 'a&r';

    if (!session || !isAdminOrAR) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const demo = await prisma.demo.findUnique({
            where: { id },
            include: {
                artist: true,
                files: true
            }
        });

        if (!demo) {
            return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });
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

    try {
        if (status === 'approved' && finalizeData) {
            const { releaseName, releaseDate, artistShare, labelShare, notes } = finalizeData;

            let updatedDemo;

            // Transaction: Atomic Update & Create
            const result = await prisma.$transaction(async (tx) => {
                // 1. Update Demo
                updatedDemo = await tx.demo.update({
                    where: { id },
                    data: {
                        status: 'approved',
                        reviewedBy: session.user.email,
                        reviewedAt: new Date(),
                        scheduledReleaseDate: releaseDate // Store chosen date
                    },
                    include: { artist: true }
                });

                // 2. Create Release (Internal)
                const release = await tx.release.create({
                    data: {
                        id: `DEMO_${id.substring(0, 8)}`, // Semi-unique short ID
                        name: releaseName || updatedDemo.title,
                        artistName: updatedDemo.artist.stageName || updatedDemo.artist.fullName,
                        image: null, // No art yet for demos
                        releaseDate: releaseDate // Sync date
                    }
                });

                // 3. Create Contract (Pending Signature)
                await tx.contract.create({
                    data: {
                        releaseId: release.id,
                        userId: updatedDemo.artistId,
                        artistShare: parseFloat(artistShare) || 0.70,
                        labelShare: parseFloat(labelShare) || 0.30,
                        notes: notes || `Auto-created from Demo: ${updatedDemo.title}`,
                        status: 'pending',
                        signedAt: null
                    }
                });

                return updatedDemo;
            });

            // Post-Transaction Notifications (Non-blocking)
            (async () => {
                try {
                    // 1. Send Email to Artist
                    if (updatedDemo.artist.email) {
                        await sendMail({
                            to: updatedDemo.artist.email,
                            subject: `🎉 Demo Approved: ${updatedDemo.title}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                                    <h1 style="color: #000; letter-spacing: 2px;">CONGRATULATIONS.</h1>
                                    <p>Your demo <strong>"${updatedDemo.title}"</strong> has been approved for release!</p>
                                    
                                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #555;">SCHEDULED RELEASE DATE</p>
                                        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${new Date(releaseDate).toLocaleDateString()}</p>
                                    </div>

                                    <p>An official contract has been generated for you. Please log in to your dashboard to view and sign it.</p>
                                    
                                    <a href="${process.env.NEXTAUTH_URL}/dashboard?view=contracts" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">VIEW CONTRACT</a>
                                    
                                    <p style="margin-top: 30px; font-size: 12px; color: #888;">Cannot wait to share this with the world.<br>The LOST Team.</p>
                                </div>
                            `
                        });
                    }

                    // 2. Send Discord Notification
                    await notifyDemoApproval(
                        updatedDemo.artist.stageName || updatedDemo.artist.fullName,
                        updatedDemo.title,
                        releaseDate
                    );

                } catch (e) {
                    console.error("Notification Error:", e);
                }
            })();

            return new Response(JSON.stringify(result), { status: 200 });
        }

        const updateData = {
            status,
            reviewedBy: session.user.email,
            reviewedAt: new Date()
        };

        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const updatedDemo = await prisma.demo.update({
            where: { id },
            data: updateData
        });

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
