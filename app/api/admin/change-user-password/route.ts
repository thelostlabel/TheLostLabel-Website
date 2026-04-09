
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { hasMinimumPasswordLength, MIN_PASSWORD_LENGTH } from '@/lib/security';

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId, newPassword } = await req.json() as { userId: string; newPassword: string };

        if (!userId || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        if (!hasMinimumPasswordLength(newPassword)) {
            return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "User password updated successfully" });

    } catch (error: unknown) {
        console.error("Admin Change Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
