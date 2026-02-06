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
                    contract: {
                        OR: [
                            { userId },
                            { primaryArtistEmail: session.user.email },
                            { artist: { userId } },
                            { artist: { email: session.user.email } },
                            { splits: { some: { userId } } },
                            { splits: { some: { email: session.user.email } } }, // Direct email match
                            { splits: { some: { user: { email: session.user.email } } } }
                        ]
                    }
                },
                include: {
                    contract: {
                        include: { release: true, splits: true, artist: true }
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

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { artistId, userId, deleteType } = body;

        let whereClause = {};

        if (deleteType === 'all_artist_earnings') {
            if (artistId) {
                // Find all contracts for this artist profile
                whereClause = {
                    contract: {
                        OR: [
                            { artistId: artistId },
                            { userId: userId } // Fallback if linked via user
                        ]
                    }
                };
            } else if (userId) {
                whereClause = {
                    contract: { userId: userId }
                };
            } else {
                return new Response(JSON.stringify({ error: "Missing artistId or userId" }), { status: 400 });
            }
        } else {
            return new Response(JSON.stringify({ error: "Invalid delete type" }), { status: 400 });
        }

        // If we strictly want to delete by artistId from Artist model
        if (artistId && !userId) {
            whereClause = {
                contract: { artistId: artistId }
            };
        }

        const deleted = await prisma.earning.deleteMany({
            where: whereClause
        });

        return new Response(JSON.stringify({ deletedCount: deleted.count }), { status: 200 });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
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

        // Get contract with splits to calculate shares
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { splits: true }
        });

        if (!contract) {
            return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
        }

        const expenses = parseFloat(body.expenseAmount) || 0;
        const gross = parseFloat(grossAmount);

        // Net Receipts Deal: Expenses come off the top
        const netReceipts = Math.max(0, gross - expenses);

        const labelAmount = netReceipts * contract.labelShare;
        const totalArtistPool = netReceipts * contract.artistShare;

        // Create the main earning record
        const earning = await prisma.earning.create({
            data: {
                contractId,
                period,
                grossAmount: gross,
                expenseAmount: expenses,
                artistAmount: totalArtistPool, // This is the TOTAL paid out to all artists/collaborators
                labelAmount,
                currency: currency || 'USD',
                streams: streams ? parseInt(streams) : null,
                source: source || 'spotify'
            }
        });

        // NOTE: In a more complex system, we might want an 'EarningSplit' table 
        // to track exactly how much each collaborator got from THIS specific payment.
        // For now, the 'artistAmount' represents the total pool shared by splits.

        return new Response(JSON.stringify(earning), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
