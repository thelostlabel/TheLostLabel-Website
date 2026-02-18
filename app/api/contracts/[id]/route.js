import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function normalizeShare(value, defaultValue) {
    if (value === undefined || value === null || value === "") return defaultValue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const normalized = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
    if (normalized < 0 || normalized > 1) return null;
    return normalized;
}

// GET: Fetch single contract
export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, stageName: true, fullName: true }
                },
                artist: true,
                splits: {
                    include: {
                        user: { select: { email: true } }
                    }
                },
                release: true,
                earnings: {
                    orderBy: { period: 'desc' }
                }
            }
        });

        if (!contract) {
            return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
        }

        const isAdminOrAR = session.user.role === 'admin' || session.user.role === 'a&r';
        const userEmail = (session.user.email || "").toLowerCase();
        const hasAccess = isAdminOrAR ||
            contract.userId === session.user.id ||
            (contract.primaryArtistEmail || "").toLowerCase() === userEmail ||
            contract.artist?.userId === session.user.id ||
            (contract.artist?.email || "").toLowerCase() === userEmail ||
            contract.splits?.some((split) =>
                split.userId === session.user.id ||
                (split.email || "").toLowerCase() === userEmail ||
                (split.user?.email || "").toLowerCase() === userEmail
            );

        if (!hasAccess) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        return new Response(JSON.stringify(contract), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PUT: Update contract (Admin only)
export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { artistShare, labelShare, status, notes, signedAt, terminatedAt, pdfUrl } = body;

        const existing = await prisma.contract.findUnique({
            where: { id },
            select: { artistShare: true, labelShare: true }
        });
        if (!existing) {
            return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
        }

        const normalizedArtistShare = normalizeShare(artistShare, existing.artistShare);
        const normalizedLabelShare = normalizeShare(labelShare, existing.labelShare);
        if (normalizedArtistShare === null || normalizedLabelShare === null) {
            return new Response(JSON.stringify({ error: "artistShare/labelShare must be between 0-1 or 0-100." }), { status: 400 });
        }
        if (Math.abs((normalizedArtistShare + normalizedLabelShare) - 1) > 0.0001) {
            return new Response(JSON.stringify({ error: "artistShare + labelShare must equal 1 (or 100%)." }), { status: 400 });
        }

        const updated = await prisma.contract.update({
            where: { id },
            data: {
                artistShare: artistShare !== undefined ? normalizedArtistShare : undefined,
                labelShare: labelShare !== undefined ? normalizedLabelShare : undefined,
                status,
                notes,
                signedAt: signedAt ? new Date(signedAt) : undefined,
                terminatedAt: terminatedAt ? new Date(terminatedAt) : undefined,
                pdfUrl
            }
        });

        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Delete contract (Admin only)
export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.contract.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
