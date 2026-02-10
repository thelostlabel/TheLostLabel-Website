import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Quick database connectivity check
        await prisma.$queryRaw`SELECT 1`;

        return new Response(JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("[Health-Check] Failed:", error.message);
        return new Response(JSON.stringify({
            status: "error",
            message: "Database connection failed"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
