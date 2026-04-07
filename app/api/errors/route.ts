import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { getClientIp, getClientUserAgent } from "@/lib/audit-log";

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
  // Rate limit by IP to prevent abuse (no auth required — errors can happen before login)
  const ip = getClientIp(req) || "unknown";
  try {
    await limiter.check(null, 30, `error-report:${ip}`);
  } catch {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions).catch(() => null);

    await prisma.clientError.create({
      data: {
        userId: session?.user?.id || null,
        message: String(body.message).slice(0, 2000),
        stack: body.stack ? String(body.stack).slice(0, 10000) : null,
        url: body.url ? String(body.url).slice(0, 2000) : null,
        source: body.source ? String(body.source).slice(0, 50) : "client",
        statusCode: typeof body.statusCode === "number" ? body.statusCode : null,
        metadata: body.metadata ? JSON.stringify(body.metadata).slice(0, 5000) : null,
        ipAddress: ip !== "unknown" ? ip : null,
        userAgent: getClientUserAgent(req),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Client Error API] Failed to log error:", error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}
