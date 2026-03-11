import prisma from "@/lib/prisma";

export function getDiscordAvatarUrl(discordUserId, avatarHash) {
    if (!discordUserId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarHash}.png`;
}

export async function getSiteUserByDiscordId(discordUserId) {
    if (!discordUserId) return null;

    const rows = await prisma.$queryRaw`
        SELECT
            u.id,
            u.email,
            u."fullName" AS "fullName",
            u."stageName" AS "stageName",
            u.role,
            u.status,
            u."discordId" AS "discordId",
            l.discord_username,
            l.discord_avatar,
            l.guild_id
        FROM "User" u
        LEFT JOIN discord_account_links l ON l.user_id = u.id
        WHERE u."discordId" = ${discordUserId}
           OR l.discord_user_id = ${discordUserId}
        ORDER BY CASE WHEN u."discordId" = ${discordUserId} THEN 0 ELSE 1 END
        LIMIT 1
    `;

    return rows?.[0] || null;
}

export async function getDiscordLinkByUserId(userId) {
    if (!userId) return null;

    const rows = await prisma.$queryRaw`
        SELECT
            l.user_id,
            l.discord_user_id,
            l.discord_username,
            l.discord_avatar,
            l.guild_id,
            l.linked_at,
            l.updated_at,
            u."discordId" AS "discordId"
        FROM discord_account_links l
        JOIN "User" u ON u.id = l.user_id
        WHERE l.user_id = ${userId}
        LIMIT 1
    `;

    return rows?.[0] || null;
}

export async function linkDiscordAccountToUser({
    userId,
    discordUserId,
    discordUsername,
    discordAvatar,
    guildId = null
}) {
    const avatarUrl = getDiscordAvatarUrl(discordUserId, discordAvatar);

    return prisma.$transaction(async (tx) => {
        const existingRows = await tx.$queryRaw`
            SELECT id FROM "User"
            WHERE "discordId" = ${discordUserId}
              AND id <> ${userId}
            LIMIT 1
        `;

        if (existingRows?.length) {
            const err = new Error("DISCORD_ACCOUNT_ALREADY_LINKED");
            err.code = "DISCORD_ACCOUNT_ALREADY_LINKED";
            throw err;
        }

        const conflictingLinkRows = await tx.$queryRaw`
            SELECT user_id FROM discord_account_links
            WHERE discord_user_id = ${discordUserId}
              AND user_id <> ${userId}
            LIMIT 1
        `;

        if (conflictingLinkRows?.length) {
            const err = new Error("DISCORD_ACCOUNT_ALREADY_LINKED");
            err.code = "DISCORD_ACCOUNT_ALREADY_LINKED";
            throw err;
        }

        await tx.$executeRaw`
            UPDATE "User"
            SET "discordId" = ${discordUserId},
                "updatedAt" = NOW()
            WHERE id = ${userId}
        `;

        await tx.$executeRaw`
            INSERT INTO discord_account_links (
                user_id,
                discord_user_id,
                discord_username,
                discord_avatar,
                guild_id,
                linked_at,
                updated_at
            )
            VALUES (
                ${userId},
                ${discordUserId},
                ${discordUsername || null},
                ${avatarUrl || null},
                ${guildId || null},
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                discord_user_id = EXCLUDED.discord_user_id,
                discord_username = EXCLUDED.discord_username,
                discord_avatar = EXCLUDED.discord_avatar,
                guild_id = EXCLUDED.guild_id,
                updated_at = NOW()
        `;

        return {
            userId,
            discordUserId,
            discordUsername: discordUsername || null,
            discordAvatar: avatarUrl,
            guildId: guildId || null
        };
    });
}

export async function unlinkDiscordAccountFromUser(userId) {
    if (!userId) return;

    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE "User"
            SET "discordId" = NULL,
                "updatedAt" = NOW()
            WHERE id = ${userId}
        `;

        await tx.$executeRaw`
            DELETE FROM discord_account_links
            WHERE user_id = ${userId}
        `;
    });
}
