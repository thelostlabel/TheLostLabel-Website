import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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

        // 4. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                stageName,
                role: 'artist',
                status: 'pending' // Enforce pending status
            }
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
