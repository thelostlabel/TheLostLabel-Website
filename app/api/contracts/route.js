import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch contracts
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { role, id: userId } = session.user;
        let contracts;

        if (role === 'admin' || role === 'a&r') {
            // Admin/A&R can see all contracts
            contracts = await prisma.contract.findMany({
                include: {
                    user: {
                        select: { id: true, email: true, stageName: true, fullName: true }
                    },
                    release: true,
                    _count: {
                        select: { earnings: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Artists can only see their own contracts
            contracts = await prisma.contract.findMany({
                where: { userId },
                include: {
                    release: true,
                    _count: {
                        select: { earnings: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return new Response(JSON.stringify({ contracts }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create a new contract (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { releaseId, userId, artistShare, labelShare, notes, status, pdfUrl } = body;

        if (!releaseId || !userId) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // Check if contract already exists for this release/user combination? 
        // Or multiple contracts allowed? Typically 1 contract per artist per release if simple.
        const existing = await prisma.contract.findFirst({
            where: { releaseId, userId }
        });

        if (existing) {
            return new Response(JSON.stringify({ error: "Contract already exists for this artist and release" }), { status: 400 });
        }

        const contract = await prisma.contract.create({
            data: {
                releaseId,
                userId,
                artistShare: artistShare !== undefined ? parseFloat(artistShare) : 0.7,
                labelShare: labelShare !== undefined ? parseFloat(labelShare) : 0.3,
                notes,
                status: status || 'active',
                pdfUrl
            },
            include: {
                user: {
                    select: { id: true, email: true, stageName: true }
                },
                release: true
            }
        });

        return new Response(JSON.stringify(contract), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
