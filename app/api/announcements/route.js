import prisma from "@/lib/prisma";

// GET: Fetch active announcements (Public/Dashboard)
export async function GET(req) {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(announcements), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
