import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';

export async function POST(req) {
    try {
        const body = await req.json();
        const { fullName, stageName, email, password } = body;

        // 1. Check System Settings
        const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
        if (settings && settings.config) {
            const config = JSON.parse(settings.config);
            if (config.registrationsOpen === false) {
                return NextResponse.json({ error: "Registrations are currently closed" }, { status: 403 });
            }
        }

        // 2. Validate Input
        if (!email || !password || !fullName || !stageName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 3. Check Existing User
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
        }

        // 4. Create User with Verification Token
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Expiry 24 hours from now
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                stageName,
                role: 'artist',
                status: 'pending',
                verificationToken,
                verificationTokenExpiry
            }
        });

        // 5. Send Verification Email
        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: email,
            subject: 'Verify your LOST. Account',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Welcome to LOST.</h1>
                    <p>Please click the button below to verify your email address and complete your registration.</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p>${verificationLink}</p>
                    <p>This link expires in 24 hours.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
