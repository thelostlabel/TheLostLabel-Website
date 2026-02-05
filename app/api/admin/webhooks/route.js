import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch all webhooks
export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const webhooks = await prisma.webhook.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(webhooks), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create new webhook
export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { name, url, events, config, enabled = true } = await req.json();

        if (!name || !url) {
            return new Response(JSON.stringify({ error: "Name and URL are required" }), { status: 400 });
        }

        if (!url.startsWith("https://discord.com/api/webhooks/")) {
            return new Response(JSON.stringify({ error: "Invalid Discord Webhook URL" }), { status: 400 });
        }

        const webhook = await prisma.webhook.create({
            data: { name, url, events: events || '', config: config || null, enabled }
        });

        return new Response(JSON.stringify(webhook), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PATCH: Update webhook
export async function PATCH(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { id, name, url, events, config, enabled } = await req.json();

        if (!id) {
            return new Response(JSON.stringify({ error: "Webhook ID required" }), { status: 400 });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (events !== undefined) updateData.events = events;
        if (config !== undefined) updateData.config = config;
        if (enabled !== undefined) updateData.enabled = enabled;

        const webhook = await prisma.webhook.update({
            where: { id },
            data: updateData
        });

        return new Response(JSON.stringify(webhook), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Delete webhook
export async function DELETE(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "Webhook ID required" }), { status: 400 });
        }

        await prisma.webhook.delete({ where: { id } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
