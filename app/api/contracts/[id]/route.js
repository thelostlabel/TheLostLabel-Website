import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch single contract
export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;

    try {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, stageName: true, fullName: true }
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

        // Permissions check
        if (session.user.role !== 'admin' && session.user.role !== 'a&r' && contract.userId !== session.user.id) {
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

    const { id } = params;

    try {
        const body = await req.json();
        const { artistShare, labelShare, status, notes, signedAt, terminatedAt, pdfUrl } = body;

        const updated = await prisma.contract.update({
            where: { id },
            data: {
                artistShare: artistShare !== undefined ? parseFloat(artistShare) : undefined,
                labelShare: labelShare !== undefined ? parseFloat(labelShare) : undefined,
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

    const { id } = params;

    try {
        await prisma.contract.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
