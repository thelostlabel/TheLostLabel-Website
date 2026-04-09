import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch active announcements (Public/Dashboard)
export async function GET(req: NextRequest) {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(announcements), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
