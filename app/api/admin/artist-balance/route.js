import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getArtistBalanceStats } from "@/lib/artist-balance";

function isAllowed(session) {
    return session && (session.user.role === "admin" || session.user.role === "a&r");
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!isAllowed(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const artistId = searchParams.get("artistId");
        if (!artistId) {
            return new Response(JSON.stringify({ error: "artistId is required" }), { status: 400 });
        }

        const artist = await prisma.artist.findUnique({
            where: { id: artistId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        stageName: true,
                        fullName: true
                    }
                }
            }
        });

        if (!artist) {
            return new Response(JSON.stringify({ error: "Artist not found" }), { status: 404 });
        }

        const stats = await getArtistBalanceStats({
            artistId: artist.id,
            userId: artist.user?.id || null,
            userEmail: artist.user?.email || artist.email || null
        });

        const adjustments = await prisma.balanceAdjustment.findMany({
            where: { artistId: artist.id },
            include: {
                createdBy: { select: { id: true, email: true, stageName: true, fullName: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 25
        });

        return new Response(JSON.stringify({
            artist: {
                id: artist.id,
                name: artist.name,
                userId: artist.userId,
                email: artist.email || artist.user?.email || null
            },
            stats,
            adjustments
        }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!isAllowed(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { artistId, amount, reason, currency = "USD" } = body;

        if (!artistId) {
            return new Response(JSON.stringify({ error: "artistId is required" }), { status: 400 });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
            return new Response(JSON.stringify({ error: "amount must be a non-zero number" }), { status: 400 });
        }

        const artist = await prisma.artist.findUnique({
            where: { id: artistId },
            include: {
                user: {
                    select: { id: true, email: true }
                }
            }
        });

        if (!artist) {
            return new Response(JSON.stringify({ error: "Artist not found" }), { status: 404 });
        }

        const adjustment = await prisma.balanceAdjustment.create({
            data: {
                artistId: artist.id,
                userId: artist.user?.id || null,
                amount: parsedAmount,
                currency,
                reason: reason ? String(reason).trim() : null,
                createdById: session.user.id
            }
        });

        const stats = await getArtistBalanceStats({
            artistId: artist.id,
            userId: artist.user?.id || null,
            userEmail: artist.user?.email || artist.email || null
        });

        return new Response(JSON.stringify({
            success: true,
            adjustment,
            stats
        }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
