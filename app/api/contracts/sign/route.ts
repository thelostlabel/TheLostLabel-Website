import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAuditEvent, getClientIp, getClientUserAgent } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
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

        logAuditEvent({
            userId: session.user.id,
            action: "sign",
            entity: "contract",
            entityId: contractId,
            ipAddress: getClientIp(req) || undefined,
            userAgent: getClientUserAgent(req) || undefined,
        });

        return new Response(JSON.stringify(updatedContract), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
