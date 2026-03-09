import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function parseConfig(value) {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function sanitizeConfig(config = {}) {
    const next = { ...(config || {}) };

    if (next.discordBridge && typeof next.discordBridge === "object") {
        next.discordBridge = { ...next.discordBridge };
        delete next.discordBridge.oauthClientSecret;
        delete next.discordBridge.internalToken;
        delete next.discordBridge.internalSigningSecret;
    }

    return next;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });

        if (!settings) {
            // Seed default settings if not exists
            const defaultConfig = JSON.stringify({
                maintenanceMode: false,
                allowRegistrations: true,
                autoApproveDemos: false,
                featuredPlaylistId: "",
                homepageNotice: ""
            });

            const defaultSettings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    config: defaultConfig
                }
            });
            return new Response(JSON.stringify({ config: JSON.stringify(sanitizeConfig(parseConfig(defaultSettings.config))) }), { status: 200 });
        }

        return new Response(JSON.stringify({ config: JSON.stringify(sanitizeConfig(parseConfig(settings.config))) }), { status: 200 });
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const incomingConfig = body.config && typeof body.config === "object" ? body.config : {};
        const existing = await prisma.systemSettings.findUnique({
            where: { id: "default" },
            select: { config: true }
        });
        const mergedConfig = sanitizeConfig({
            ...parseConfig(existing?.config),
            ...incomingConfig
        });

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(mergedConfig) },
            create: { id: "default", config: JSON.stringify(mergedConfig) }
        });

        return new Response(JSON.stringify({ success: true, config: JSON.stringify(sanitizeConfig(parseConfig(settings.config))) }), { status: 200 });
    } catch (error) {
        console.error("Save Settings Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
