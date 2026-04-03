/**
 * Prisma client for the Control Panel database.
 * Used by tenant apps to fetch their config from the central control DB.
 * Only instantiated when CONTROL_DB_URL is set — safe to import without the
 * control-panel project present (e.g. standalone Docker builds).
 */

import type { PrismaClient as PrismaClientType } from "@prisma/client";

const globalForControlDb = globalThis as unknown as {
  controlDb: PrismaClientType | null | undefined;
};

function createControlDb(): PrismaClientType | null {
  if (!process.env.CONTROL_DB_URL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("../control-panel/node_modules/.prisma/control-panel-client");
    return new PrismaClient({
      datasources: { db: { url: process.env.CONTROL_DB_URL } },
      log: [],
    }) as PrismaClientType;
  } catch {
    // control-panel client not available in this deployment
    return null;
  }
}

export const controlDb: PrismaClientType | null =
  globalForControlDb.controlDb ??
  (globalForControlDb.controlDb = createControlDb());
