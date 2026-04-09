import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SITE_CONTENT_CACHE_TAG, getManagedSiteContent, getSiteContentByKey } from "@/lib/site-content";
import { MANAGED_SITE_CONTENT_KEYS, type SiteContentKey } from "@/lib/site-content-data";
import type { Session } from "next-auth";

const PUBLIC_CONTENT_KEYS = new Set(MANAGED_SITE_CONTENT_KEYS);

function isAdminSession(session: Session | null): boolean {
    return Boolean(session?.user?.role === "admin");
}

// GET: Fetch site content by key
export async function GET(req: NextRequest): Promise<Response> {
    const { searchParams } = new URL(req.url);
    const key = String(searchParams.get('key') || '').trim();

    try {
        if (key) {
            if (!PUBLIC_CONTENT_KEYS.has(key as SiteContentKey)) {
                const session = await getServerSession(authOptions);
                if (!isAdminSession(session)) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
                }

                const content = await prisma.siteContent.findUnique({
                    where: { key }
                });
                return new Response(JSON.stringify(content), { status: 200 });
            }

            const content = await getSiteContentByKey(key as SiteContentKey);
            return new Response(JSON.stringify(content), { status: 200 });
        } else {
            const session = await getServerSession(authOptions);
            if (!isAdminSession(session)) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const allContent = await getManagedSiteContent();
            return new Response(JSON.stringify(allContent), { status: 200 });
        }
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// POST: Create or update content (Admin only)
export async function POST(req: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { key, title, content } = await req.json() as { key: string; title: string; content: string };

        if (!key || !title) {
            return new Response(JSON.stringify({ error: "Key and title required" }), { status: 400 });
        }

        const result = await prisma.siteContent.upsert({
            where: { key },
            update: { title, content },
            create: { key, title, content }
        });

        revalidateTag(SITE_CONTENT_CACHE_TAG, "default");

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error: unknown) {
        console.error("Content Save Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
