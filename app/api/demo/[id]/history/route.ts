import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canViewAllDemos } from "@/lib/permissions";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/auth-utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
        return new Response(JSON.stringify({ error: accessError }), { status: 403 });
    }

    if (!canViewAllDemos(session.user)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { id } = await params;

    try {
        const logs = await prisma.auditLog.findMany({
            where: { entity: "demo", entityId: id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const userIds = [...new Set(logs.map((l) => l.userId))];
        const users = userIds.length
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, stageName: true },
            })
            : [];
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        const enriched = logs.map((log) => ({
            ...log,
            user: userMap[log.userId] || { id: log.userId, email: null, stageName: null },
        }));

        return new Response(JSON.stringify(enriched), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
