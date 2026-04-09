import { getServerSession } from "next-auth/next";
import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PUBLIC_SETTINGS_CACHE_TAG } from "@/lib/public-settings";
import {
    getDefaultSystemSettings,
    normalizeSystemSettingsConfig,
    parseSystemSettingsConfig
} from "@/lib/system-settings";

function sanitizeConfig(config: Record<string, unknown> = {}): Record<string, unknown> {
    const next: Record<string, unknown> = { ...(config || {}) };

    if (next.discordBridge && typeof next.discordBridge === "object") {
        next.discordBridge = { ...(next.discordBridge as Record<string, unknown>) };
        delete (next.discordBridge as Record<string, unknown>).oauthClientSecret;
        delete (next.discordBridge as Record<string, unknown>).internalToken;
        delete (next.discordBridge as Record<string, unknown>).internalSigningSecret;
    }

    return next;
}

export async function GET(req: NextRequest) {
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
            const defaultConfig = JSON.stringify(getDefaultSystemSettings());

            const defaultSettings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    config: defaultConfig
                }
            });
            return new Response(JSON.stringify({
                config: JSON.stringify(
                    sanitizeConfig(normalizeSystemSettingsConfig(parseSystemSettingsConfig(defaultSettings.config)))
                )
            }), { status: 200 });
        }

        return new Response(JSON.stringify({
            config: JSON.stringify(
                sanitizeConfig(normalizeSystemSettingsConfig(parseSystemSettingsConfig(settings.config)))
            )
        }), { status: 200 });
    } catch (error: unknown) {
        console.error("Fetch Settings Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
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
            ...normalizeSystemSettingsConfig(parseSystemSettingsConfig(existing?.config)),
            ...incomingConfig
        });

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(mergedConfig) },
            create: { id: "default", config: JSON.stringify(mergedConfig) }
        });

        revalidateTag(PUBLIC_SETTINGS_CACHE_TAG);

        return new Response(JSON.stringify({
            success: true,
            config: JSON.stringify(
                sanitizeConfig(normalizeSystemSettingsConfig(parseSystemSettingsConfig(settings.config)))
            )
        }), { status: 200 });
    } catch (error: unknown) {
        console.error("Save Settings Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
