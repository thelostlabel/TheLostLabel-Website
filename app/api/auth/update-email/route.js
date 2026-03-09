
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { generateVerificationEmail } from '@/lib/mail-templates';
import rateLimit from '@/lib/rate-limit';
import {
    buildRateLimitKey,
    generateOpaqueToken,
    hashOpaqueToken,
    normalizeEmail,
    passesRateLimit
} from '@/lib/security';

const updateEmailLimiter = rateLimit({
    interval: 30 * 60 * 1000,
    uniqueTokenPerInterval: 3000
});

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentEmail, newEmail } = await req.json();
        const normalizedNewEmail = normalizeEmail(newEmail);

        const allowed = await passesRateLimit(updateEmailLimiter, 5, buildRateLimitKey(req, 'update-email', session.user.id));
        if (!allowed) {
            return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
        }

        if (!normalizedNewEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Find current session user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Optional cross-check if client sent currentEmail
        if (currentEmail && user.email.toLowerCase() !== String(currentEmail).toLowerCase()) {
            return NextResponse.json({ error: "Current email does not match authenticated user" }, { status: 403 });
        }

        // 2. Security Check: Only allow if not yet verified
        if (user.emailVerified) {
            return NextResponse.json({ error: "Cannot change email after verification. Please contact support." }, { status: 400 });
        }

        // 3. Check if new email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedNewEmail }
        });

        if (existingUser && existingUser.id !== user.id) {
            return NextResponse.json({ error: "Unable to update email" }, { status: 400 });
        }

        // 4. Update Email and Generate New Token
        const verificationToken = generateOpaqueToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: normalizedNewEmail,
                verificationToken: hashOpaqueToken(verificationToken),
                verificationTokenExpiry
            }
        });

        // 5. Send New Verification Email
        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: normalizedNewEmail,
            subject: 'Confirm your collective identity (Updated) | LOST.',
            html: generateVerificationEmail(verificationLink)
        });

        return NextResponse.json({ success: true, message: "Email updated and new verification link sent" });

    } catch (error) {
        console.error("Update Email Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
