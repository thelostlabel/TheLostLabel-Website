import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        let settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
        if (!settings) {
            // Default config
            const defaultConfig = {
                allowCoverArt: true,
                allowAudio: true,
                allowDelete: true,
                allowOther: true,
                genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other']
            };
            settings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    config: JSON.stringify(defaultConfig)
                }
            });
        }
        return new Response(JSON.stringify(settings), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { config } = body; // Expect JSON object

        const updated = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { config: JSON.stringify(config) },
            create: { id: "default", config: JSON.stringify(config) }
        });

        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
