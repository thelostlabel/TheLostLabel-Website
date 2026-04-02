import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import { markAsRead, markAllAsRead, getUnreadCount } from "@/lib/notification-service";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 20, maxLimit: 50 });
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: { userId: string; read?: boolean } = { userId: session.user.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      getUnreadCount(session.user.id),
    ]);

    return new Response(
      JSON.stringify({
        notifications,
        unreadCount,
        pagination: buildOffsetPaginationMeta(total, page, limit),
      }),
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("GET /api/notifications error:", e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.markAllRead === true) {
      await markAllAsRead(session.user.id);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (body.id && typeof body.id === "string") {
      await markAsRead(body.id, session.user.id);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("PATCH /api/notifications error:", e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
