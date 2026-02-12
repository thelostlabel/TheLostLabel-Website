
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';
import { generatePasswordResetEmail } from '@/lib/mail-templates';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // For security reasons, don't reveal if user exists
        if (!user) {
            return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        await sendMail({
            to: email,
            subject: 'Reset your LOST. Access | Secure Link',
            html: generatePasswordResetEmail(resetLink)
        });

        return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
