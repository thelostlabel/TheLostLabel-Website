import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { linkUserToArtist } from "@/lib/userArtistLink";

// GET: Fetch all users (Admin only)
export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                stageName: true,
                spotifyUrl: true,
                monthlyListeners: true,
                role: true,
                status: true,
                permissions: true,
                emailVerified: true,
                createdAt: true
            }
        });

        return new Response(JSON.stringify(users), { status: 200 });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PATCH: Update user details (Admin only)
export async function PATCH(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, email, fullName, stageName, spotifyUrl, role, status } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
        }

        const oldUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!oldUser) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        // Build update object with only provided fields
        const updateData = {};

        if (email !== undefined) updateData.email = email;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (stageName !== undefined) updateData.stageName = stageName;
        if (spotifyUrl !== undefined) updateData.spotifyUrl = spotifyUrl;
        if (status !== undefined) updateData.status = status;

        if (role !== undefined) {
            const validRoles = ['artist', 'a&r', 'admin'];
            if (!validRoles.includes(role)) {
                return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
            }
            updateData.role = role;
        }

        if (body.permissions !== undefined) updateData.permissions = body.permissions;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Trigger approval side effects without failing the main user update.
        // This prevents local SMTP or integration issues from returning a PATCH 500.
        if (status === 'approved' && oldUser.status !== 'approved') {
            try {
                await linkUserToArtist(userId);
            } catch (error) {
                console.error("[Users PATCH] Artist linking failed during approval:", error);
            }

            try {
                await sendMail({
                    to: updatedUser.email,
                    subject: "Your Account Has Been Approved | LOST.",
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0d10; color: #fff; padding: 32px; border-radius: 12px; border: 1px solid #1b1f24;">
                            <h1 style="color: #9ef01a; letter-spacing: 1px; margin: 0 0 16px 0;">Your Account Has Been Approved</h1>
                            <p style="font-size: 16px; line-height: 1.6;">
                                Your application to join LOST. has been approved. You can now sign in and start using your dashboard.
                            </p>
                            <div style="margin-top: 24px;">
                                <a href="${process.env.NEXTAUTH_URL}/auth/login" style="background: #ffffff; color: #111; padding: 12px 20px; text-decoration: none; font-weight: 700; border-radius: 8px; display: inline-block;">Sign In to Dashboard</a>
                            </div>
                            <p style="margin-top: 28px; color: #97a0ab; font-size: 12px;">
                                If this was not you, please contact our support team immediately.
                            </p>
                        </div>
                    `
                });
            } catch (error) {
                console.error("[Users PATCH] Approval email failed:", error);
            }
        }

        // Safety net: keep approved users linked even when profile fields are edited later
        if (updatedUser.status === 'approved') {
            try {
                await linkUserToArtist(userId);
            } catch (error) {
                console.error("[Users PATCH] Artist relink failed:", error);
            }
        }

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        console.error("Update User Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Delete user (Admin only)
export async function DELETE(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing user id" }), { status: 400 });
        }

        // Prevent self-deletion
        if (userId === session.user.id) {
            return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Delete User Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
