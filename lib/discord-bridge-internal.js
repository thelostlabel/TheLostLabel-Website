import prisma from "@/lib/prisma";
import { getSiteUserByDiscordId } from "@/lib/discord-bridge-service";
import { demoListSelect } from "@/lib/demo-queries";

export function normalizeDiscordUserId(authContext, body = {}) {
    return String(
        authContext?.discordUserId ||
        body?.discordUserId ||
        body?.discord_user_id ||
        ""
    ).trim();
}

export async function resolveLinkedSiteUser(authContext, body = {}) {
    const discordUserId = normalizeDiscordUserId(authContext, body);

    if (!discordUserId) {
        return {
            ok: false,
            status: 400,
            error: "discordUserId is required."
        };
    }

    const user = await getSiteUserByDiscordId(discordUserId);
    if (!user) {
        return {
            ok: false,
            status: 404,
            error: "Discord account is not linked to a site account."
        };
    }

    return {
        ok: true,
        discordUserId,
        user
    };
}

export async function fetchArtistEarningsForUser(user) {
    const userId = user.id;
    const userEmail = user.email;

    return prisma.earning.findMany({
        where: {
            contract: {
                OR: [
                    { userId },
                    { primaryArtistEmail: userEmail },
                    { artist: { userId } },
                    { artist: { email: userEmail } },
                    { splits: { some: { userId } } },
                    { splits: { some: { email: userEmail } } },
                    { splits: { some: { user: { email: userEmail } } } }
                ]
            }
        },
        include: {
            contract: {
                include: {
                    release: { select: { id: true, name: true, spotifyUrl: true } },
                    user: { select: { id: true, stageName: true, email: true } }
                }
            }
        },
        orderBy: { period: "desc" },
        take: 20
    });
}

export async function fetchContractsForUser(user) {
    const userId = user.id;
    const userEmail = user.email;

    return prisma.contract.findMany({
        where: {
            OR: [
                { userId },
                { primaryArtistEmail: userEmail },
                { artist: { userId } },
                { artist: { email: userEmail } },
                { splits: { some: { userId } } },
                { splits: { some: { email: userEmail } } },
                { splits: { some: { user: { email: userEmail } } } }
            ]
        },
        include: {
            release: { select: { id: true, name: true, spotifyUrl: true, releaseDate: true } },
            splits: { select: { name: true, percentage: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    });
}

export async function fetchDemosForUser(user) {
    return prisma.demo.findMany({
        where: { artistId: user.id },
        select: demoListSelect,
        orderBy: { createdAt: "desc" },
        take: 20
    });
}
