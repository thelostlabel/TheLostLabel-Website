import prisma from "@/lib/prisma";

// GET: Fetch total artist count
export async function GET() {
    try {
        const count = await prisma.user.count({
            where: { role: 'artist' }
        });

        return new Response(JSON.stringify({ count }), { status: 200 });
    } catch (error) {
        console.error("Stats Error:", error);
        return new Response(JSON.stringify({ count: 0 }), { status: 200 });
    }
}
