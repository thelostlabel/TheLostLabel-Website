import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

const REQUIRED_TABLES = [
    "discord_account_links",
    "discord_oauth_states",
    "discord_internal_audit",
    "discord_event_outbox",
    "discord_role_sync_queue"
];

const REQUIRED_USER_COLUMNS = ["discordId", "discordNotifyEnabled"];

let schemaCheckPromise = null;

async function queryBridgeSchemaStatus() {
    const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name IN (${Prisma.join(REQUIRED_TABLES)})
    `;

    const columns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'User'
          AND column_name IN (${Prisma.join(REQUIRED_USER_COLUMNS)})
    `;

    const tableNames = new Set((tables || []).map((row) => row.table_name));
    const columnNames = new Set((columns || []).map((row) => row.column_name));
    const missingTables = REQUIRED_TABLES.filter((name) => !tableNames.has(name));
    const missingUserColumns = REQUIRED_USER_COLUMNS.filter((name) => !columnNames.has(name));

    return {
        ready: missingTables.length === 0 && missingUserColumns.length === 0,
        missingTables,
        missingUserColumns
    };
}

export async function getDiscordBridgeSchemaStatus({ force = false } = {}) {
    if (force || !schemaCheckPromise) {
        schemaCheckPromise = queryBridgeSchemaStatus().catch((error) => {
            schemaCheckPromise = null;
            throw error;
        });
    }

    return schemaCheckPromise;
}

export async function assertDiscordBridgeSchemaReady() {
    const status = await getDiscordBridgeSchemaStatus();
    if (status.ready) return status;

    const err = new Error("DISCORD_BRIDGE_SCHEMA_NOT_READY");
    err.code = "DISCORD_BRIDGE_SCHEMA_NOT_READY";
    err.details = status;
    throw err;
}
