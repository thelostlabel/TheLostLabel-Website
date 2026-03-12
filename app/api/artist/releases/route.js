import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { buildArtistOwnedContractScope, resolveArtistContextForUser } from "@/lib/artist-identity";
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById } from "@/lib/release-artists";

function extractSpotifyArtistId(url) {
    if (!url || typeof url !== "string") return null;
    const parts = url.split('/').filter((p) => p.trim() !== '');
    const lastPart = parts.pop() || '';
    const id = lastPart.split('?')[0]?.trim();
    return id || null;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Always get latest user profile from DB to avoid session sync issues
    const artistContext = await resolveArtistContextForUser(session.user.id);
    const user = artistContext.user;

    // Extract Artist ID
    const spotifyId = extractSpotifyArtistId(user?.artist?.spotifyUrl) || extractSpotifyArtistId(user?.spotifyUrl);

    try {
        const contractScope = buildArtistOwnedContractScope({
            userId: session.user.id,
            userEmail: user?.email || session.user.email,
            artistId: artistContext.artistId
        });

        // Build OR conditions
        const orConditions = contractScope.length
            ? [{ contracts: { some: { OR: contractScope } } }]
            : [];

        const releaseArtistCondition = getReleaseArtistWhereById(spotifyId);
        if (releaseArtistCondition) {
            orConditions.push(releaseArtistCondition);
        }

        const releases = await prisma.release.findMany({
            where: {
                OR: orConditions
            },
            orderBy: { releaseDate: 'desc' },
            include: {
                requests: {
                    where: { userId: session.user.id },
                    orderBy: { updatedAt: 'desc' }
                },
                contracts: {
                    where: contractScope.length ? { OR: contractScope } : undefined,
                    select: { id: true }
                }
            }
        });

        return new Response(JSON.stringify(releases), { status: 200 });
    } catch (e) {
        console.error("Fetch Releases Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
