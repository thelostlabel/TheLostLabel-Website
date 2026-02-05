import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch earnings
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { role, id: userId } = session.user;
        let earnings;

        if (role === 'admin' || role === 'a&r') {
            earnings = await prisma.earning.findMany({
                include: {
                    contract: {
                        include: {
                            user: { select: { id: true, stageName: true, email: true } },
                            release: true
                        }
                    }
                },
                orderBy: { period: 'desc' }
            });
        } else {
            earnings = await prisma.earning.findMany({
                where: {
                    contract: { userId }
                },
                include: {
                    contract: {
                        include: { release: true }
                    }
                },
                orderBy: { period: 'desc' }
            });
        }

        return new Response(JSON.stringify({ earnings }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Add new earning record (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { contractId, period, grossAmount, currency, streams, source } = body;

        if (!contractId || !period || grossAmount === undefined) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // Get contract to calculate shares
        const contract = await prisma.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
        }

        const artistAmount = parseFloat(grossAmount) * contract.artistShare;
        const labelAmount = parseFloat(grossAmount) * contract.labelShare;

        const earning = await prisma.earning.create({
            data: {
                contractId,
                period,
                grossAmount: parseFloat(grossAmount),
                artistAmount,
                labelAmount,
                currency: currency || 'USD',
                streams: streams ? parseInt(streams) : null,
                source: source || 'spotify'
            },
            include: {
                contract: {
                    include: { release: true }
                }
            }
        });

        return new Response(JSON.stringify(earning), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
