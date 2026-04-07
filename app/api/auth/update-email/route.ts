import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { updateEmailBodySchema } from "@/lib/auth-schemas";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import {
  buildRateLimitKey,
  generateOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  passesRateLimit,
} from "@/lib/security";
import { logAuditEvent, getClientIp, getClientUserAgent } from "@/lib/audit-log";
import { sendMail } from "@/lib/mail";
import { generateVerificationEmail } from "@/lib/mail-templates";

const updateEmailLimiter = rateLimit({
  interval: 30 * 60 * 1000,
  uniqueTokenPerInterval: 3000,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsedBody = updateEmailBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { currentEmail, newEmail } = parsedBody.data;
    const normalizedNewEmail = normalizeEmail(newEmail);

    const allowed = await passesRateLimit(updateEmailLimiter, 5, buildRateLimitKey(req, "update-email", session.user.id));
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    if (!normalizedNewEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentEmail && user.email.toLowerCase() !== String(currentEmail).toLowerCase()) {
      return NextResponse.json({ error: "Current email does not match authenticated user" }, { status: 403 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Cannot change email after verification. Please contact support." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedNewEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "Unable to update email" }, { status: 400 });
    }

    const verificationToken = generateOpaqueToken();
    const verificationTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: normalizedNewEmail,
        verificationToken: hashOpaqueToken(verificationToken),
        verificationTokenExpiry,
      },
    });

    const verificationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${verificationToken}`;

    await sendMail({
      to: normalizedNewEmail,
      subject: "Confirm your collective identity (Updated) | LOST.",
      html: generateVerificationEmail(verificationLink),
    });

    logAuditEvent({
      userId: session.user.id,
      action: "update",
      entity: "email",
      entityId: session.user.id,
      details: JSON.stringify({ oldEmail: user.email, newEmail: normalizedNewEmail }),
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
    });

    return NextResponse.json({ success: true, message: "Email updated and new verification link sent" });
  } catch (error) {
    console.error("Update Email Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
