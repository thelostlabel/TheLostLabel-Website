import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { fetchWithTimeout, isTransientStatus } from "@/lib/fetch-utils";

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 250
});

function isValidDiscordWebhookUrl(value) {
    try {
        const parsed = new URL(String(value || "").trim());
        return parsed.protocol === "https:" &&
            parsed.hostname === "discord.com" &&
            /^\/api\/webhooks\/[^/]+\/[^/]+$/.test(parsed.pathname);
    } catch {
        return false;
    }
}

// POST: Test webhook notification
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        try {
            await limiter.check(null, 10, `webhook-test:${session.user.id}`);
        } catch {
            return new Response(JSON.stringify({ error: "Too many test attempts" }), { status: 429 });
        }

        const body = await req.json().catch(() => null);
        const webhookId = String(body?.webhookId || "").trim();
        if (!webhookId) {
            return new Response(JSON.stringify({ error: "Webhook ID is required" }), { status: 400 });
        }

        const webhook = await prisma.webhook.findUnique({
            where: { id: webhookId },
            select: { id: true, name: true, url: true }
        });

        if (!webhook) {
            return new Response(JSON.stringify({ error: "Webhook not found" }), { status: 404 });
        }

        if (!isValidDiscordWebhookUrl(webhook.url)) {
            return new Response(JSON.stringify({ error: "Stored webhook URL is invalid" }), { status: 400 });
        }

        const response = await fetchWithTimeout(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "LOST Music Bot",
                avatar_url: "https://i.imgur.com/AfFp7pu.png",
                embeds: [{
                    title: "Webhook Test",
                    description: "This is a test notification from the LOST Admin Panel.",
                    color: 0x9B59B6,
                    fields: [
                        { name: "Status", value: "Connected", inline: true },
                        { name: "Time", value: new Date().toLocaleString(), inline: true }
                    ]
                }]
            })
        }, 10_000);

        const success = response.ok;
        const status = success ? 200 : (isTransientStatus(response.status) ? 502 : 400);
        return new Response(JSON.stringify({
            success,
            webhookId: webhook.id,
            webhookName: webhook.name,
            upstreamStatus: response.status
        }), { status });
    } catch (error) {
        console.error("Webhook Test Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
