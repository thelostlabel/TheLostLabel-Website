import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { contractId } = await req.json();

        const updatedContract = await prisma.contract.update({
            where: {
                id: contractId,
                userId: session.user.id // Ensure only the contract owner can sign
            },
            data: {
                status: 'active',
                signedAt: new Date()
            }
        });

        return new Response(JSON.stringify(updatedContract), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
