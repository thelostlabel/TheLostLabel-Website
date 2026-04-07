import prisma from "@/lib/prisma";

interface AuditEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (e) {
    console.error("[AuditLog] Failed to log event:", e);
  }
}

export function getClientUserAgent(req: Request): string | null {
  return req.headers.get("user-agent") || null;
}

export function getClientIp(req: Request): string | null {
  const headers = req.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}
