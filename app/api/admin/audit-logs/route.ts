import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });

    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = action;
    }
    if (entity) {
      where.entity = entity;
    }
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Look up user info for the logs
    const userIds = [...new Set(logs.map((l: { userId: string }) => l.userId))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, stageName: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u: { id: string; email: string; stageName: string | null }) => [u.id, u]));

    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      user: userMap[log.userId] || { id: log.userId, email: null, stageName: null },
    }));

    return new Response(
      JSON.stringify({
        logs: enrichedLogs,
        pagination: buildOffsetPaginationMeta(total, page, limit),
      }),
      { status: 200 },
    );
  } catch (e: any) {
    console.error("[AuditLogs API] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
