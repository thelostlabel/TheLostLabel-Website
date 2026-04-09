import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAuditEvent, getClientIp, getClientUserAgent } from "@/lib/audit-log";

function isAdminSession(session: Session | null): boolean {
    return Boolean(session?.user?.role === "admin");
}

// GET: Fetch all announcements (Admin only)
export async function GET(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(announcements), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// POST: Create or update announcement (Admin only)
export async function POST(req: NextRequest): Promise<Response> {
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

        logAuditEvent({
            userId: session!.user.id,
            action: id ? "update" : "create",
            entity: "announcement",
            entityId: result.id,
            details: JSON.stringify({ title }),
            ipAddress: getClientIp(req) || undefined,
            userAgent: getClientUserAgent(req) || undefined,
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error: unknown) {
        console.error("Announcement Save Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// DELETE: Delete announcement (Admin only)
export async function DELETE(req: NextRequest): Promise<Response> {
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

        logAuditEvent({
            userId: session!.user.id,
            action: "delete",
            entity: "announcement",
            entityId: id,
            ipAddress: getClientIp(req) || undefined,
            userAgent: getClientUserAgent(req) || undefined,
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
