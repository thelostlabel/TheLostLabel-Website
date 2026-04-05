/**
 * Prisma client for the Control Panel database.
 * Only instantiated when CONTROL_DB_URL is set — safe to import without the
 * control-panel project present (e.g. standalone Docker builds).
 *
 * Uses `any` type because the control panel has its own Prisma schema
 * (with Tenant model) that differs from the main app's schema.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const globalForControlDb = globalThis as unknown as {
  controlDb: any | null | undefined;
};

function createControlDb(): any | null {
  if (!process.env.CONTROL_DB_URL) return null;
  try {
    // Use indirect require path so bundlers skip static analysis on this import.
    const clientPath = ["..", "control-panel", "node_modules", ".prisma", "control-panel-client"].join("/");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(/* webpackIgnore: true */ clientPath);
    return new mod.PrismaClient({
      datasources: { db: { url: process.env.CONTROL_DB_URL } },
      log: [],
    });
  } catch {
    // control-panel client not available in this deployment
    return null;
  }
}

export const controlDb: any | null =
  globalForControlDb.controlDb ??
  (globalForControlDb.controlDb = createControlDb());
