
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE: Delete a specific earning record
export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.earning.delete({
            where: { id }
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Delete Earning Error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete earning" }), { status: 500 });
    }
}

// PATCH: Update a specific earning record
export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { grossAmount, expenseAmount, period, streams, source, contractId } = body;

        // Fetch the contract to get shares for recalculation
        // If contractId is changing, we fetch the NEW contract. Otherwise the existing one.
        // But for simplicity, we usually don't change contractId on edit easily without fetching it.
        // Let's assume we fetch the current earning to get contractId if not provided, or use provided.

        const currentEarning = await prisma.earning.findUnique({
            where: { id },
            include: { contract: true }
        });

        if (!currentEarning) {
            return new Response(JSON.stringify({ error: "Earning not found" }), { status: 404 });
        }

        const targetContractId = contractId || currentEarning.contractId;

        // If contract changed, we need to fetch the new contract details
        let contract = currentEarning.contract;
        if (contractId && contractId !== currentEarning.contractId) {
            contract = await prisma.contract.findUnique({ where: { id: contractId } });
            if (!contract) return new Response(JSON.stringify({ error: "New contract not found" }), { status: 404 });
        }

        const gross = grossAmount !== undefined ? parseFloat(grossAmount) : currentEarning.grossAmount;
        const expense = expenseAmount !== undefined ? parseFloat(expenseAmount) : currentEarning.expenseAmount;

        // Recalculate
        const netReceipts = Math.max(0, gross - expense);
        const labelAmount = netReceipts * contract.labelShare;
        const artistAmount = netReceipts * contract.artistShare;

        const updated = await prisma.earning.update({
            where: { id },
            data: {
                contractId: targetContractId,
                period: period || currentEarning.period,
                grossAmount: gross,
                expenseAmount: expense,
                artistAmount,
                labelAmount,
                streams: streams !== undefined ? parseInt(streams) : currentEarning.streams,
                source: source || currentEarning.source
            }
        });

        return new Response(JSON.stringify(updated), { status: 200 });

    } catch (error) {
        console.error("Update Earning Error:", error);
        return new Response(JSON.stringify({ error: "Failed to update earning" }), { status: 500 });
    }
}
