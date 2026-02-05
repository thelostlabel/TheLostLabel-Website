import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { legalName, phoneNumber, address } = body;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                legalName,
                phoneNumber,
                address
            }
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
