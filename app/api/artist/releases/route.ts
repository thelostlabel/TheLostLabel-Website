import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { buildArtistOwnedContractScope, resolveArtistContextForUser } from "@/lib/artist-identity";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById } from "@/lib/release-artists";

function extractSpotifyArtistId(url: string | null | undefined): string | null {
    if (!url || typeof url !== "string") return null;
    const parts = url.split('/').filter((p) => p.trim() !== '');
    const lastPart = parts.pop() || '';
    const id = lastPart.split('?')[0]?.trim();
    return id || null;
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
    const accessError = getDashboardAccessError(accessUser);
    if (accessError) {
        return new Response(JSON.stringify({ error: accessError }), { status: 403 });
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
        const orConditions: Record<string, unknown>[] = contractScope.length
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
    } catch (error: unknown) {
        console.error("Fetch Releases Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
