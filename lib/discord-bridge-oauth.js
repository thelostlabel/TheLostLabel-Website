import { randomUUID } from "crypto";

import prisma from "@/lib/prisma";

const OAUTH_STATE_TTL_MINUTES = 15;

export function createDiscordOauthStateToken() {
    return randomUUID().replace(/-/g, "");
}

export async function createDiscordOauthState({
    state,
    userId = null,
    discordUserId = null,
    discordUsername = null
}) {
    const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MINUTES * 60_000);
    await prisma.$executeRaw`
        INSERT INTO discord_oauth_states (state, user_id, discord_user_id, discord_username, expires_at)
        VALUES (${state}, ${userId}, ${discordUserId}, ${discordUsername}, ${expiresAt})
    `;

    return { state, expiresAt };
}

export async function getDiscordOauthState(state) {
    const rows = await prisma.$queryRaw`
        SELECT state, user_id, discord_user_id, discord_username, created_at, expires_at, consumed_at
        FROM discord_oauth_states
        WHERE state = ${state}
        LIMIT 1
    `;
    return rows?.[0] || null;
}

export async function attachUserToDiscordOauthState({ state, userId }) {
    await prisma.$executeRaw`
        UPDATE discord_oauth_states
        SET user_id = ${userId}
        WHERE state = ${state}
          AND consumed_at IS NULL
    `;
}

export async function consumeDiscordOauthState(state) {
    const rows = await prisma.$queryRaw`
        UPDATE discord_oauth_states
        SET consumed_at = NOW()
        WHERE state = ${state}
          AND consumed_at IS NULL
        RETURNING state, user_id, discord_user_id, discord_username, expires_at, created_at, consumed_at
    `;

    return rows?.[0] || null;
}

export async function cleanupExpiredDiscordOauthStates() {
    await prisma.$executeRawUnsafe(`
        DELETE FROM discord_oauth_states
        WHERE expires_at < NOW() - INTERVAL '1 day'
    `);
}
