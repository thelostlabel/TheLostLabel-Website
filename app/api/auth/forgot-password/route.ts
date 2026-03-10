import { NextResponse } from "next/server";

import { emailBodySchema } from "@/lib/auth-schemas";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { buildRateLimitKey, generateOpaqueToken, hashOpaqueToken, normalizeEmail, passesRateLimit } from "@/lib/security";
import { sendMail } from "@/lib/mail";
import { generatePasswordResetEmail } from "@/lib/mail-templates";

const forgotPasswordLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 4000,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsedBody = emailBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const email = normalizeEmail(parsedBody.data.email);

    const allowed = await passesRateLimit(forgotPasswordLimiter, 6, buildRateLimitKey(req, "forgot-password", email));
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent" });
    }

    const resetToken = generateOpaqueToken();
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashOpaqueToken(resetToken),
        resetTokenExpiry,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    await sendMail({
      to: email,
      subject: "Reset your LOST. Access | Secure Link",
      html: generatePasswordResetEmail(resetLink),
    });

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
