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

        // Trigger Approval Actions
        if (status === 'approved' && oldUser.status !== 'approved') {
            // 1. Link to Artist Profile if exists
            await linkUserToArtist(userId);

            // 2. Send Email
            await sendMail({
                to: updatedUser.email,
                subject: "✨ Hesabın Onaylandı! | LOST.",
                html: `
                    <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 10px;">
                        <h1 style="color: #00ff88; letter-spacing: 2px;">HOŞ GELDİN GÜLÜM!</h1>
                        <p style="font-size: 16px; line-height: 1.6;">
                            LOST. ailesine katılım isteğin onaylandı. Artık paneline giriş yapabilir ve dünyanı bizimle paylaşmaya başlayabilirsin.
                        </p>
                        <div style="margin-top: 30px;">
                            <a href="${process.env.NEXTAUTH_URL}/auth/login" style="background: #fff; color: #000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">PANELI AÇ</a>
                        </div>
                        <p style="margin-top: 40px; color: #444; font-size: 12px;">
                            Eğer bu işlemi sen yapmadıysan lütfen bizimle iletişime geç.
                        </p>
                    </div>
                `
            });
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
