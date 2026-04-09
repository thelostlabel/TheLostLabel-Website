import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidDiscordWebhookUrl } from "@/lib/discord-webhooks";
import type { Session } from "next-auth";

function isAdminSession(session: Session | null): boolean {
    return Boolean(session?.user?.role === "admin");
}

// GET: Fetch all webhooks
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const webhooks = await prisma.webhook.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(webhooks), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// POST: Create new webhook
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { name, url, events, config, enabled = true } = await req.json();
        const normalizedUrl = String(url || "").trim();

        if (!name || !normalizedUrl) {
            return new Response(JSON.stringify({ error: "Name and URL are required" }), { status: 400 });
        }

        if (!isValidDiscordWebhookUrl(normalizedUrl)) {
            return new Response(JSON.stringify({ error: "Invalid Discord Webhook URL" }), { status: 400 });
        }

        const webhook = await prisma.webhook.create({
            data: { name, url: normalizedUrl, events: events || '', config: config || null, enabled }
        });

        return new Response(JSON.stringify(webhook), { status: 201 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// PATCH: Update webhook
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { id, name, url, events, config, enabled } = await req.json();

        if (!id) {
            return new Response(JSON.stringify({ error: "Webhook ID required" }), { status: 400 });
        }

        if (url !== undefined && !isValidDiscordWebhookUrl(url)) {
            return new Response(JSON.stringify({ error: "Invalid Discord Webhook URL" }), { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = String(url).trim();
        if (events !== undefined) updateData.events = events;
        if (config !== undefined) updateData.config = config;
        if (enabled !== undefined) updateData.enabled = enabled;

        const webhook = await prisma.webhook.update({
            where: { id },
            data: updateData
        });

        return new Response(JSON.stringify(webhook), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

// DELETE: Delete webhook
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!isAdminSession(session)) {
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
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
