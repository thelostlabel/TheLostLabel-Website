import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdminSession(session) {
    return Boolean(session?.user?.role === "admin");
}

// GET: Fetch all announcements (Admin only)
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(announcements), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create or update announcement (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { id, title, content, type, active, linkUrl, linkText } = await req.json();

        if (!title || !content) {
            return new Response(JSON.stringify({ error: "Title and content required" }), { status: 400 });
        }

        let result;
        if (id) {
            result = await prisma.announcement.update({
                where: { id },
                data: { title, content, type, active, linkUrl, linkText }
            });
        } else {
            result = await prisma.announcement.create({
                data: { title, content, type, active: active !== undefined ? active : true, linkUrl, linkText }
            });
        }

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error("Announcement Save Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Delete announcement (Admin only)
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
        }

        await prisma.announcement.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
