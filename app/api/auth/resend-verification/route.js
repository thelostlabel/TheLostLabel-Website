
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import { generateVerificationEmail } from '@/lib/mail-templates';
import rateLimit from '@/lib/rate-limit';
import { buildRateLimitKey, generateOpaqueToken, hashOpaqueToken, normalizeEmail, passesRateLimit } from '@/lib/security';

const resendVerificationLimiter = rateLimit({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 4000
});

export async function POST(req) {
    try {
        const body = await req.json();
        const email = normalizeEmail(body?.email);

        const allowed = await passesRateLimit(resendVerificationLimiter, 5, buildRateLimitKey(req, 'resend-verification', email));
        if (!allowed) {
            return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
        }

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.emailVerified) {
            return NextResponse.json({ success: true, message: "If the account can receive a verification link, it has been sent" });
        }

        // Generate new token
        const verificationToken = generateOpaqueToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: hashOpaqueToken(verificationToken),
                verificationTokenExpiry
            }
        });

        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: email,
            subject: 'Confirm your collective identity | LOST.',
            html: generateVerificationEmail(verificationLink)
        });

        return NextResponse.json({ success: true, message: "If the account can receive a verification link, it has been sent" });

    } catch (error) {
        console.error("Resend Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
