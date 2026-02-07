import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    try {
        const release = await prisma.release.update({
            where: { id },
            data: {
                name: data.name,
                artistName: data.artistName,
                releaseDate: data.releaseDate ? new Date(data.releaseDate).toISOString() : undefined,
                image: data.image,
                spotifyUrl: data.spotifyUrl,
                type: data.type
            }
        });

        return new Response(JSON.stringify(release), { status: 200 });
    } catch (e) {
        console.error("Release Update Error:", e);
        return new Response(JSON.stringify({ error: "Failed to update release" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    try {
        // Optional: clean up contracts or requests if needed, but let's try direct delete first
        await prisma.release.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error("Release Delete Error:", e);
        return new Response(JSON.stringify({ error: "Failed to delete release. It may be linked to contracts or requests." }), { status: 500 });
    }
}
