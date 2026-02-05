import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: Bulk add earnings
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const { earnings } = await req.json(); // Array of { contractId, period, grossAmount, streams, source }

        if (!Array.isArray(earnings)) {
            return new Response(JSON.stringify({ error: "Invalid data format. Expected an array." }), { status: 400 });
        }

        const results = [];
        const errors = [];

        for (const item of earnings) {
            try {
                const contract = await prisma.contract.findUnique({
                    where: { id: item.contractId }
                });

                if (!contract) {
                    errors.push({ item, error: "Contract not found" });
                    continue;
                }

                const artistAmount = parseFloat(item.grossAmount) * contract.artistShare;
                const labelAmount = parseFloat(item.grossAmount) * contract.labelShare;

                const earning = await prisma.earning.create({
                    data: {
                        contractId: item.contractId,
                        period: item.period,
                        grossAmount: parseFloat(item.grossAmount),
                        artistAmount,
                        labelAmount,
                        currency: item.currency || 'USD',
                        streams: item.streams ? parseInt(item.streams) : null,
                        source: item.source || 'spotify'
                    }
                });
                results.push(earning);
            } catch (err) {
                errors.push({ item, error: err.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            count: results.length,
            errors: errors.length > 0 ? errors : undefined
        }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
