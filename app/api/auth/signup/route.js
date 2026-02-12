import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';
import { generateVerificationEmail } from '@/lib/mail-templates';

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

        // 4. Check for Existing Artist to Link
        const existingArtist = await prisma.artist.findFirst({
            where: {
                OR: [
                    { name: { equals: stageName, mode: 'insensitive' } },
                    { email: { equals: email, mode: 'insensitive' } }
                ],
                userId: null // Only link if not already linked
            }
        });

        // 5. Create User with Verification Token
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

        // 6. Link Artist if found
        if (existingArtist) {
            await prisma.artist.update({
                where: { id: existingArtist.id },
                data: { userId: user.id }
            });
        }

        // 5. Send Verification Email
        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: email,
            subject: 'Confirm your collective identity | LOST.',
            html: generateVerificationEmail(verificationLink)
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
