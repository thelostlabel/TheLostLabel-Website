import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch current user's profile
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                legalName: true,
                phoneNumber: true,
                address: true,
                stageName: true,
                spotifyUrl: true,
                monthlyListeners: true,
                role: true,
                createdAt: true,
                notifyDemos: true,
                notifyEarnings: true,
                notifySupport: true,
                notifyContracts: true
            }
        });

        return new Response(JSON.stringify(user), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PATCH: Update current user's profile
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            email,
            fullName,
            legalName,
            phoneNumber,
            address,
            stageName,
            spotifyUrl,
            notifyDemos,
            notifyEarnings,
            notifySupport,
            notifyContracts
        } = body;

        // Check if user is linked to an Artist profile
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { artist: true }
        });

        // Create update object
        let dataToUpdate = {
            email: email || undefined,
            fullName: fullName || undefined,
            legalName: legalName !== undefined ? legalName : undefined,
            phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
            address: address !== undefined ? address : undefined,
            notifyDemos: notifyDemos !== undefined ? notifyDemos : undefined,
            notifyEarnings: notifyEarnings !== undefined ? notifyEarnings : undefined,
            notifySupport: notifySupport !== undefined ? notifySupport : undefined,
            notifyContracts: notifyContracts !== undefined ? notifyContracts : undefined
        };

        // stageName and spotifyUrl are intentionally NOT updateable via this endpoint.
        // Users must contact support to change these values.

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: dataToUpdate
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
