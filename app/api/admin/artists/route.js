import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const [users, rosterArtists] = await Promise.all([
            prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'artist' },
                        { spotifyUrl: { not: null } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    stageName: true,
                    spotifyUrl: true,
                    monthlyListeners: true,
                    role: true,
                    createdAt: true,
                    _count: { select: { demos: true } }
                }
            }),
            prisma.artist.findMany({
                orderBy: { createdAt: 'desc' }
            }) // Fetch Roster Artists
        ]);

        const formattedUsers = users.map(u => ({
            id: u.id,
            type: 'registered',
            name: u.stageName || 'Unknown',
            email: u.email,
            role: u.role,
            spotifyUrl: u.spotifyUrl,
            monthlyListeners: u.monthlyListeners,
            demosCount: u._count.demos,
            createdAt: u.createdAt
        }));

        const formattedRoster = rosterArtists.map(a => ({
            id: a.id,
            type: 'roster',
            name: a.name,
            email: null, // Not registered
            spotifyUrl: a.spotifyUrl,
            monthlyListeners: a.monthlyListeners,
            demosCount: 0,
            createdAt: a.createdAt
        }));

        // Combine. Typically we might want to deduplicate if we can match them,
        // but for now let's just show all.
        const allArtists = [...formattedUsers, ...formattedRoster].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return new Response(JSON.stringify(allArtists), { status: 200 });
    } catch (error) {
        console.error("Fetch Artists Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Check permissions if A&R
    if (session.user.role === 'a&r' && !session.user.permissions?.canManageArtists) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');

        if (!id || !type) return new Response("Missing id or type", { status: 400 });

        if (type === 'registered') {
            await prisma.user.delete({ where: { id } });
        } else if (type === 'roster') {
            await prisma.artist.delete({ where: { id } });
        }

        return new Response(null, { status: 204 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (session.user.role === 'a&r' && !session.user.permissions?.canManageArtists) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, type, name, spotifyUrl } = body;

        if (type === 'registered') {
            await prisma.user.update({
                where: { id },
                data: { stageName: name, spotifyUrl }
            });
        } else if (type === 'roster') {
            await prisma.artist.update({
                where: { id },
                data: { name, spotifyUrl }
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
