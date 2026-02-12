import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        if (newPassword.length < 6) {
            return new Response(JSON.stringify({ error: "New password must be at least 6 characters" }), { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        // Check if user has a password (they might have signed up via provider, though here we assume credentials)
        if (!user.password) {
            return new Response(JSON.stringify({ error: "No password set for this account. Possibly social login." }), { status: 400 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return new Response(JSON.stringify({ error: "Current password is incorrect" }), { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Failed to change password" }), { status: 500 });
    }
}
