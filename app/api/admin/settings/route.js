import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
            return new Response(JSON.stringify({ config: defaultSettings.config }), { status: 200 });
        }

        return new Response(JSON.stringify({ config: settings.config }), { status: 200 });
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
        const configToStore = body.config; // Extract the inner config object

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(configToStore) },
            create: { id: "default", config: JSON.stringify(configToStore) }
        });

        return new Response(JSON.stringify({ success: true, config: settings.config }), { status: 200 });
    } catch (error) {
        console.error("Save Settings Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
