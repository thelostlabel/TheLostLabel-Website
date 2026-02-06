import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: List all artists
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const artists = await prisma.artist.findMany({
            include: {
                user: {
                    select: { id: true, email: true, stageName: true, fullName: true }
                },
                _count: {
                    select: { contracts: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Also fetch Users who are NOT linked to any artist, to show as "Available for Linking"
        const unlistedUsers = await prisma.user.findMany({
            where: {
                role: { in: ['artist', 'a&r'] }, // Include A&R as they might need profiles too? Or just artist. Let's stick to 'artist' primarily but maybe 'a&r' if they release music.
                artist: null
            },
            select: { id: true, email: true, stageName: true, fullName: true, role: true }
        });

        return new Response(JSON.stringify({ artists, unlistedUsers }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create a new Artist Profile
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, spotifyUrl, email, image, userId } = body;

        if (!name) {
            return new Response(JSON.stringify({ error: "Artist Name is required" }), { status: 400 });
        }

        let linkedUserId = userId || null;

        // Auto-link logic: If email provided but no userId, try to find a matching user
        if (!linkedUserId && email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (existingUser) {
                linkedUserId = existingUser.id;
            }
        }

        const artist = await prisma.artist.create({
            data: {
                name,
                spotifyUrl: spotifyUrl || null,
                email: email ? email.toLowerCase() : null,
                image: image || null,
                userId: linkedUserId
            }
        });

        return new Response(JSON.stringify(artist), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// PUT: Update an Artist (e.g. Link User)
export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, userId, name, email, spotifyUrl, image, status } = body;

        if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });

        const updateData = {};
        if (userId !== undefined) updateData.userId = userId;
        if (name) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (spotifyUrl !== undefined) updateData.spotifyUrl = spotifyUrl;
        if (image !== undefined) updateData.image = image;
        if (status) updateData.status = status;

        const artist = await prisma.artist.update({
            where: { id },
            data: updateData,
            include: { user: true }
        });

        return new Response(JSON.stringify(artist), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
