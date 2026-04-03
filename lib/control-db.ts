/**
 * Prisma client for the Control Panel database.
 * Used by tenant apps to fetch their config from the central control DB.
 */

import { PrismaClient } from "../control-panel/node_modules/.prisma/control-panel-client";

const globalForControlDb = globalThis as unknown as {
  controlDb: PrismaClient | undefined;
};

export const controlDb =
  globalForControlDb.controlDb ??
  (process.env.CONTROL_DB_URL
    ? new PrismaClient({
        datasources: { db: { url: process.env.CONTROL_DB_URL } },
        log: [],
      })
    : null);

if (process.env.NODE_ENV !== "production" && controlDb) {
  globalForControlDb.controlDb = controlDb;
}
