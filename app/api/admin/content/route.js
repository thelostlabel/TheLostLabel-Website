import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch site content by key
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    try {
        if (key) {
            let content = await prisma.siteContent.findUnique({
                where: { key }
            });

            // Auto-initialize FAQ if missing
            if (!content && key === 'faq') {
                const defaultFaqs = [
                    { q: "How do I submit a demo?", a: "Register as an artist, access your portal, and use the 'NEW SUBMISSION' button." },
                    { q: "How can I track my distribution?", a: "Once signed, our A&R team will provide updates through the portal." },
                    { q: "How do royalties and payments work?", a: "Royalties are calculated monthly. View revenue in the 'EARNINGS' tab." },
                    { q: "What about legal contracts?", a: "Contracts are generated digitally and available in the 'CONTRACTS' section." },
                    { q: "Do you offer Spotify sync?", a: "Yes, our system syncs with your Spotify Artist profile automatically." }
                ];
                content = {
                    key: 'faq',
                    title: 'FAQ / Sıkça Sorulan Sorular',
                    content: JSON.stringify(defaultFaqs),
                    updatedAt: new Date()
                };
            }

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
