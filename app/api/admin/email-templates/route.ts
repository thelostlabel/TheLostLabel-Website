import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const templates = await prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' },
        });
        return new Response(JSON.stringify({ templates }), { status: 200 });
    } catch (e: any) {
        console.error("Email templates GET error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { slug, name, subject, body: templateBody, blocks, variables, active } = body;

        if (!slug || !name || !subject || !templateBody) {
            return new Response(
                JSON.stringify({ error: "slug, name, subject, and body are required" }),
                { status: 400 },
            );
        }

        const template = await prisma.emailTemplate.create({
            data: {
                slug,
                name,
                subject,
                body: templateBody,
                blocks: blocks ?? null,
                variables: variables ?? null,
                active: active ?? true,
            },
        });

        return new Response(JSON.stringify(template), { status: 201 });
    } catch (e: any) {
        if (e.code === "P2002") {
            return new Response(
                JSON.stringify({ error: "A template with this slug already exists" }),
                { status: 409 },
            );
        }
        console.error("Email templates POST error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, slug, name, subject, body: templateBody, blocks, variables, active } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
        }

        const data: Record<string, unknown> = {};
        if (slug !== undefined) data.slug = slug;
        if (name !== undefined) data.name = name;
        if (subject !== undefined) data.subject = subject;
        if (templateBody !== undefined) data.body = templateBody;
        if (blocks !== undefined) data.blocks = blocks;
        if (variables !== undefined) data.variables = variables;
        if (active !== undefined) data.active = active;

        const template = await prisma.emailTemplate.update({
            where: { id },
            data,
        });

        return new Response(JSON.stringify(template), { status: 200 });
    } catch (e: any) {
        if (e.code === "P2002") {
            return new Response(
                JSON.stringify({ error: "A template with this slug already exists" }),
                { status: 409 },
            );
        }
        console.error("Email templates PATCH error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
        }

        await prisma.emailTemplate.delete({ where: { id } });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Email templates DELETE error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
