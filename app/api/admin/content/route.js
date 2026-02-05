import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch site content by key
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    try {
        if (key) {
            const content = await prisma.siteContent.findUnique({
                where: { key }
            });
            return new Response(JSON.stringify(content), { status: 200 });
        } else {
            const allContent = await prisma.siteContent.findMany();
            return new Response(JSON.stringify(allContent), { status: 200 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create or update content (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { key, title, content } = await req.json();

        if (!key || !title) {
            return new Response(JSON.stringify({ error: "Key and title required" }), { status: 400 });
        }

        const result = await prisma.siteContent.upsert({
            where: { key },
            update: { title, content },
            create: { key, title, content }
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error("Content Save Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
