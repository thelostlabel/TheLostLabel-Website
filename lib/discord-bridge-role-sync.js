import prisma from "@/lib/prisma";

import { getDiscordBridgeConfig } from "@/lib/discord-bridge-config";

function normalizeRole(role) {
    if (!role) return "artist";
    const lowered = String(role).trim().toLowerCase();
    if (lowered === "admin" || lowered === "a&r" || lowered === "artist") return lowered;
    return "artist";
}

function extractSpotifyArtistId(url) {
    if (!url || typeof url !== "string") return null;
    const parts = url.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    const id = last.split("?")[0]?.trim();
    return id || null;
}

export async function enqueueRoleSync({
    userId,
    discordUserId,
    role,
    guildId = null
}) {
    if (!userId) return null;

    const bridgeConfig = await getDiscordBridgeConfig();
    const normalizedRole = normalizeRole(role);
    const targetDiscordRoleId = bridgeConfig?.roleMap?.[normalizedRole] || null;

    const existing = await prisma.$queryRaw`
        SELECT id, user_id, discord_user_id, target_role, target_discord_role_id, guild_id, status, created_at
        FROM discord_role_sync_queue
        WHERE user_id = ${userId}
          AND target_role = ${normalizedRole}
          AND status IN ('pending', 'processing')
        ORDER BY created_at DESC
        LIMIT 1
    `;
    if (existing?.[0]) {
        return existing[0];
    }

    const rows = await prisma.$queryRaw`
        INSERT INTO discord_role_sync_queue (
            user_id,
            discord_user_id,
            target_role,
            target_discord_role_id,
            guild_id,
            status,
            attempts,
            created_at,
            updated_at
        )
        VALUES (
            ${userId},
            ${discordUserId || null},
            ${normalizedRole},
            ${targetDiscordRoleId},
            ${guildId || bridgeConfig.defaultGuildId || null},
            'pending',
            0,
            NOW(),
            NOW()
        )
        RETURNING id, user_id, discord_user_id, target_role, target_discord_role_id, guild_id, status, created_at
    `;

    return rows?.[0] || null;
}

export async function enqueueArtistRoleSyncForRelease(release) {
    if (!release) return { queued: 0, users: [] };

    let artists = [];
    try {
        artists = typeof release.artistsJson === "string"
            ? JSON.parse(release.artistsJson)
            : (Array.isArray(release.artistsJson) ? release.artistsJson : []);
    } catch {
        artists = [];
    }

    const artistIds = new Set(
        (artists || [])
            .map((item) => (typeof item === "object" ? item?.id : null))
            .filter(Boolean)
    );
    if (!artistIds.size) return { queued: 0, users: [] };

    const linkedRows = await prisma.$queryRaw`
        SELECT
            u.id AS user_id,
            u.role,
            u.status,
            u."spotifyUrl" AS user_spotify_url,
            a."spotifyUrl" AS artist_spotify_url,
            l.discord_user_id,
            l.guild_id
        FROM "User" u
        LEFT JOIN "Artist" a ON a."userId" = u.id
        JOIN discord_account_links l ON l.user_id = u.id
        WHERE u.role = 'artist'
    `;

    const matchedUsers = [];
    for (const row of linkedRows || []) {
        if (String(row?.status || "").toLowerCase() !== "approved") continue;
        const userSpotifyId = extractSpotifyArtistId(row?.user_spotify_url);
        const artistSpotifyId = extractSpotifyArtistId(row?.artist_spotify_url);
        if (!artistIds.has(userSpotifyId) && !artistIds.has(artistSpotifyId)) continue;
        matchedUsers.push(row);
    }

    let queued = 0;
    for (const user of matchedUsers) {
        const result = await enqueueRoleSync({
            userId: user.user_id,
            discordUserId: user.discord_user_id,
            role: "artist",
            guildId: user.guild_id || null
        });
        if (result?.id) queued += 1;
    }

    return {
        queued,
        users: matchedUsers.map((u) => u.user_id)
    };
}
