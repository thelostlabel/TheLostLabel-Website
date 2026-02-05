import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        const { userId, email, fullName, stageName, spotifyUrl, role } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
        }

        // Build update object with only provided fields
        const updateData = {};

        if (email !== undefined) updateData.email = email;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (stageName !== undefined) updateData.stageName = stageName;
        if (spotifyUrl !== undefined) updateData.spotifyUrl = spotifyUrl;

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
