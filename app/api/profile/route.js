import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch current user's profile
export async function GET() {
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
                status: true,
                createdAt: true,
                notifyDemos: true,
                notifyEarnings: true,
                notifySupport: true,
                notifyContracts: true,
                artist: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        spotifyUrl: true,
                        monthlyListeners: true
                    }
                }
            }
        });

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        const profile = {
            ...user,
            stageName: user.stageName || user.artist?.name || null,
            spotifyUrl: user.spotifyUrl || user.artist?.spotifyUrl || null,
            monthlyListeners: user.monthlyListeners ?? user.artist?.monthlyListeners ?? 0,
            artistImage: user.artist?.image || null
        };

        return new Response(JSON.stringify(profile), { status: 200 });
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
            notifyDemos,
            notifyEarnings,
            notifySupport,
            notifyContracts
        } = body;

        // Create update object
        let dataToUpdate = {
            email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined,
            fullName: typeof fullName === 'string' ? fullName.trim() || null : undefined,
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
