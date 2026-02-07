#!/usr/bin/env node
/**
 * Moves legacy uploads from public/ to private/ and rewrites DB paths.
 * Also copies prisma/*.db into private/db for safe-keeping (originals left in place).
 *
 * Run: `node scripts/migrate_uploads_to_private.mjs`
 */
import { promises as fs } from "fs";
import path from "path";
import prisma from "../lib/prisma.js";

const root = process.cwd();

const dirMappings = [
  {
    from: "public/uploads/demos",
    to: "private/uploads/demos",
    fields: [{ model: "demoFile", field: "filepath" }],
    replacements: ["/uploads/demos/", "public/uploads/demos/"],
  },
  {
    from: "public/uploads/contracts",
    to: "private/uploads/contracts",
    fields: [{ model: "contract", field: "pdfUrl" }],
    replacements: ["/uploads/contracts/", "public/uploads/contracts/"],
  },
  {
    from: "public/uploads/releases",
    to: "private/uploads/releases",
    fields: [{ model: "release", field: "image" }],
    replacements: ["/uploads/releases/", "public/uploads/releases/"],
  },
  {
    from: "public/uploads/covers",
    to: "private/uploads/releases",
    fields: [{ model: "release", field: "image" }],
    replacements: ["/uploads/covers/", "public/uploads/covers/"],
  },
];

const dbBackupDir = "private/db";

async function ensureDir(dir) {
  await fs.mkdir(path.join(root, dir), { recursive: true });
}

async function moveFiles(fromDir, toDir) {
  const absFrom = path.join(root, fromDir);
  const absTo = path.join(root, toDir);

  try {
    const entries = await fs.readdir(absFrom, { withFileTypes: true });
    await ensureDir(toDir);
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const src = path.join(absFrom, entry.name);
      const dest = path.join(absTo, entry.name);
      await fs.rename(src, dest).catch(async (err) => {
        if (err.code === "EEXIST") return;
        if (err.code === "ENOENT") return;
        // Fall back to copy then unlink to avoid cross-device issues
        await fs.copyFile(src, dest);
        await fs.unlink(src).catch(() => {});
      });
      console.log(`Moved ${src} -> ${dest}`);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`Skip ${fromDir} (not found)`);
      return;
    }
    throw err;
  }
}

const modelUpdaters = {
  demoFile: async (field, replacements) => {
    const rows = await prisma.demoFile.findMany({ select: { id: true, [field]: true } });
    for (const row of rows) {
      const updated = replacePrefixes(row[field], replacements, "private/uploads/demos/");
      if (updated && updated !== row[field]) {
        await prisma.demoFile.update({ where: { id: row.id }, data: { [field]: updated } });
        console.log(`Updated demoFile ${row.id} -> ${updated}`);
      }
    }
  },
  contract: async (field, replacements) => {
    const rows = await prisma.contract.findMany({ select: { id: true, [field]: true } });
    for (const row of rows) {
      const updated = replacePrefixes(row[field], replacements, "private/uploads/contracts/");
      if (updated && updated !== row[field]) {
        await prisma.contract.update({ where: { id: row.id }, data: { [field]: updated } });
        console.log(`Updated contract ${row.id} -> ${updated}`);
      }
    }
  },
  release: async (field, replacements) => {
    const rows = await prisma.release.findMany({ select: { id: true, [field]: true } });
    for (const row of rows) {
      const updated = replacePrefixes(row[field], replacements, "private/uploads/releases/");
      if (updated && updated !== row[field]) {
        await prisma.release.update({ where: { id: row.id }, data: { [field]: updated } });
        console.log(`Updated release ${row.id} -> ${updated}`);
      }
    }
  },
};

function replacePrefixes(value, replacements, targetPrefix) {
  if (!value) return value;
  let next = value;
  for (const oldPrefix of replacements) {
    if (next.startsWith(oldPrefix)) {
      next = next.replace(oldPrefix, targetPrefix);
    }
  }
  return next;
}

async function backupDbs() {
  await ensureDir(dbBackupDir);
  const prismaDir = path.join(root, "prisma");
  const files = await fs.readdir(prismaDir).catch(() => []);
  for (const file of files) {
    if (!file.endsWith(".db")) continue;
    const src = path.join(prismaDir, file);
    const dest = path.join(root, dbBackupDir, file);
    await fs.copyFile(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  }
}

async function main() {
  for (const mapping of dirMappings) {
    await moveFiles(mapping.from, mapping.to);
    for (const f of mapping.fields) {
      const updater = modelUpdaters[f.model];
      if (updater) await updater(f.field, mapping.replacements);
    }
  }

  await backupDbs();
  console.log("Done. Originals remain; remove public uploads manually if desired.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
