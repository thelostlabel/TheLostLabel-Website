import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkRequestBody {
  action: string;
  ids: string[];
  params?: Record<string, unknown>;
}

interface BulkResult {
  success: string[];
  failed: Array<{ id: string; error: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function approveArtists(ids: string[]): Promise<BulkResult> {
  const success: string[] = [];
  const failed: BulkResult["failed"] = [];

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await prisma.artist.update({
        where: { id },
        data: { status: "active", verified: true },
      });
      return id;
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      success.push(result.value);
    } else {
      failed.push({ id: ids[i], error: result.reason?.message ?? "Unknown error" });
    }
  }

  return { success, failed };
}

async function approvePayments(ids: string[]): Promise<BulkResult> {
  const success: string[] = [];
  const failed: BulkResult["failed"] = [];

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await prisma.payment.update({
        where: { id },
        data: { status: "completed", processedAt: new Date() },
      });
      return id;
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      success.push(result.value);
    } else {
      failed.push({ id: ids[i], error: result.reason?.message ?? "Unknown error" });
    }
  }

  return { success, failed };
}

async function rejectPayments(ids: string[]): Promise<BulkResult> {
  const success: string[] = [];
  const failed: BulkResult["failed"] = [];

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await prisma.payment.update({
        where: { id },
        data: { status: "failed", processedAt: new Date() },
      });
      return id;
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      success.push(result.value);
    } else {
      failed.push({ id: ids[i], error: result.reason?.message ?? "Unknown error" });
    }
  }

  return { success, failed };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const ACTION_MAP: Record<string, (ids: string[], params?: Record<string, unknown>) => Promise<BulkResult>> = {
  "approve-artists": approveArtists,
  "approve-payments": approvePayments,
  "reject-payments": rejectPayments,
};

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as BulkRequestBody;
    const { action, ids, params } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "action and a non-empty ids array are required" }, { status: 400 });
    }

    const handler = ACTION_MAP[action];
    if (!handler) {
      return Response.json({ error: `Unknown bulk action: ${action}` }, { status: 400 });
    }

    const result = await handler(ids, params);
    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message ?? "Internal server error" }, { status: 500 });
  }
}
