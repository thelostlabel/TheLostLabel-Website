
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: "Email already verified" }, { status: 400 });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry
            }
        });

        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: email,
            subject: 'Verify your LOST. Account',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Verify Your Email</h1>
                    <p>You requested a new verification email for your LOST. account.</p>
                    <p>Please click the button below to verify your email address.</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p>${verificationLink}</p>
                    <p>This link expires in 24 hours.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: "Verification email sent" });

    } catch (error) {
        console.error("Resend Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
