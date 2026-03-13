import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canFinalizeDemos, hasAdminViewPermission } from "@/lib/permissions";
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import prisma from "@/lib/prisma";
import { linkUserToArtist, normalizeArtistValue } from "@/lib/userArtistLink";

function canAccessArtists(user) {
    return hasAdminViewPermission(user, "admin_view_artists") || canFinalizeDemos(user);
}

// GET: List all artists
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !canAccessArtists(session.user)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 500 });

        const [artists, total] = await Promise.all([
            prisma.artist.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            stageName: true,
                            fullName: true,
                            legalName: true,
                            phoneNumber: true,
                            address: true
                        }
                    },
                    _count: {
                        select: { contracts: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit
            }),
            prisma.artist.count()
        ]);

        // Also fetch Users who are NOT linked to any artist, to show as "Available for Linking"
        const unlistedUsers = await prisma.user.findMany({
            where: {
                role: { in: ['artist', 'a&r'] }, // Include A&R as they might need profiles too? Or just artist. Let's stick to 'artist' primarily but maybe 'a&r' if they release music.
                artist: null
            },
            select: { id: true, email: true, stageName: true, fullName: true, role: true }
        });

        return new Response(JSON.stringify({
            artists,
            unlistedUsers,
            pagination: buildOffsetPaginationMeta(total, page, limit)
        }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create a new Artist Profile
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !canAccessArtists(session.user)) {
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

        const normalizedName = normalizeArtistValue(name);
        const normalizedEmail = email ? email.toLowerCase() : null;
        const existingArtists = await prisma.artist.findMany({
            where: {
                OR: [
                    normalizedEmail ? { email: { equals: normalizedEmail, mode: 'insensitive' } } : undefined,
                    { name: { equals: name, mode: 'insensitive' } }
                ].filter(Boolean)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        stageName: true,
                        fullName: true,
                        legalName: true,
                        phoneNumber: true,
                        address: true
                    }
                }
            }
        });

        const duplicate = existingArtists.find((artist) => (
            (normalizedEmail && artist.email?.toLowerCase() === normalizedEmail) ||
            normalizeArtistValue(artist.name) === normalizedName
        ));

        if (duplicate) {
            if (linkedUserId && !duplicate.userId) {
                const updatedArtist = await prisma.artist.update({
                    where: { id: duplicate.id },
                    data: {
                        userId: linkedUserId,
                        ...(duplicate.email ? {} : { email: normalizedEmail })
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                stageName: true,
                                fullName: true,
                                legalName: true,
                                phoneNumber: true,
                                address: true
                            }
                        }
                    }
                });

                await linkUserToArtist(linkedUserId);
                return new Response(JSON.stringify(updatedArtist), { status: 200 });
            }

            return new Response(JSON.stringify(duplicate), { status: 200 });
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
    if (!session || !canAccessArtists(session.user)) {
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

        if (userId) {
            await linkUserToArtist(userId);
        }

        return new Response(JSON.stringify(artist), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
