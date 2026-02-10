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
            const defaultSettings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    config: JSON.stringify({
                        maintenanceMode: false,
                        allowRegistrations: true,
                        autoApproveDemos: false,
                        featuredPlaylistId: "",
                        homepageNotice: ""
                    })
                }
            });
            return new Response(defaultSettings.config, { status: 200 });
        }

        return new Response(settings.config, { status: 200 });
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const config = await req.json();

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(config) },
            create: { id: "default", config: JSON.stringify(config) }
        });

        return new Response(settings.config, { status: 200 });
    } catch (error) {
        console.error("Save Settings Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
