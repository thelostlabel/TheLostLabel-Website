
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';
import { generateVerificationEmail } from '@/lib/mail-templates';

export async function POST(req) {
    try {
        const { currentEmail, newEmail } = await req.json();

        if (!currentEmail || !newEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Find the user
        const user = await prisma.user.findUnique({
            where: { email: currentEmail }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Security Check: Only allow if not yet verified
        if (user.emailVerified) {
            return NextResponse.json({ error: "Cannot change email after verification. Please contact support." }, { status: 400 });
        }

        // 3. Check if new email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: "This email is already registered" }, { status: 400 });
        }

        // 4. Update Email and Generate New Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: newEmail,
                verificationToken,
                verificationTokenExpiry
            }
        });

        // 5. Send New Verification Email
        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: newEmail,
            subject: 'Confirm your collective identity (Updated) | LOST.',
            html: generateVerificationEmail(verificationLink)
        });

        return NextResponse.json({ success: true, message: "Email updated and new verification link sent" });

    } catch (error) {
        console.error("Update Email Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
