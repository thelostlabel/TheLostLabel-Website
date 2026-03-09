import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { linkUserToArtist } from '@/lib/userArtistLink';
import rateLimit from '@/lib/rate-limit';
import { buildRateLimitKey, hashOpaqueToken, passesRateLimit } from '@/lib/security';

const verifyEmailLimiter = rateLimit({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5000
});

export async function POST(req) {
    try {
        const { token } = await req.json();

        const allowed = await passesRateLimit(verifyEmailLimiter, 10, buildRateLimitKey(req, 'verify-email'));
        if (!allowed) {
            return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
        }

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: hashOpaqueToken(token),
                verificationTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });

        if (user.status === 'approved') {
            await linkUserToArtist(user.id);
        }

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            email: user.email,
            accountStatus: user.status
        });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
