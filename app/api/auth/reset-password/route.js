
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import rateLimit from '@/lib/rate-limit';
import {
    buildRateLimitKey,
    hashOpaqueToken,
    hasMinimumPasswordLength,
    MIN_PASSWORD_LENGTH,
    passesRateLimit
} from '@/lib/security';

const resetPasswordLimiter = rateLimit({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5000
});

export async function POST(req) {
    try {
        const { token, password } = await req.json();

        const allowed = await passesRateLimit(resetPasswordLimiter, 8, buildRateLimitKey(req, 'reset-password'));
        if (!allowed) {
            return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
        }

        if (!token || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!hasMinimumPasswordLength(password)) {
            return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashOpaqueToken(token),
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
