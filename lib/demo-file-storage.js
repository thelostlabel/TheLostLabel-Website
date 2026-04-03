import { mkdir, rename, stat } from "fs/promises";
import { createHash } from "crypto";
import { basename, dirname, extname, join } from "path";
import { tmpdir } from "os";
import { spawn } from "child_process";
import { resolvePrivateStorageCandidates } from "@/lib/private-storage-paths";

const REMOTE_DEMO_HOST = process.env.REMOTE_STORAGE_HOST || "root@152.53.142.222";
const REMOTE_SSH_OPTIONS = [
  "-o", "StrictHostKeyChecking=no",
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=5",
];
const downloadPromises = new Map();

const execFileAsync = (...args) => {
  const { execFile } = require("child_process");
  return new Promise((resolve, reject) => {
    execFile(...args, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

export function getDemoFileCandidatePaths(filepath, allowedPrefixes = ["private/uploads/demos/"]) {
  if (!filepath || typeof filepath !== "string") return [];

  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];

  const isAllowed = allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
  if (!isAllowed) return [];

  return resolvePrivateStorageCandidates(normalized, allowedPrefixes);
}

export function getDemoRemoteCandidatePaths(filepath, remoteRoot) {
  if (!filepath || !remoteRoot) return [];

  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];

  const relativeToApp = normalized;
  const relativeToPrivate = normalized.startsWith("private/")
    ? normalized.replace(/^private\/+/, "")
    : normalized;

  return Array.from(new Set([
    join(remoteRoot, relativeToApp),
    join(remoteRoot, relativeToPrivate),
  ]));
}

async function findExistingLocalPath(candidates) {
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      return { path: candidate, info };
    } catch {
      // Try next path.
    }
  }

  return null;
}

async function resolveRemoteDemoFile(filepath) {
  const remoteRoot = process.env.REMOTE_STORAGE_PATH;
  if (!remoteRoot || process.env.NODE_ENV !== "development") return null;

  const remoteCandidates = getDemoRemoteCandidatePaths(filepath, remoteRoot);
  for (const candidate of remoteCandidates) {
    try {
      const { stdout } = await execFileAsync("ssh", [
        ...REMOTE_SSH_OPTIONS,
        REMOTE_DEMO_HOST,
        "stat",
        "-c%s",
        candidate,
      ]);

      return {
        remotePath: candidate,
        size: Number.parseInt(String(stdout).trim(), 10) || null,
      };
    } catch {
      // Try next remote candidate.
    }
  }

  return null;
}

function getRemoteCachePath(filepath, remotePath) {
  const cacheRoot = process.env.DEV_REMOTE_DEMO_CACHE_DIR || join(tmpdir(), "lost-demo-cache");
  const normalized = filepath.replace(/^\/+/, "");
  const hash = createHash("sha1").update(remotePath).digest("hex").slice(0, 12);
  const ext = extname(normalized);
  const safeBase = basename(normalized, ext).replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  return {
    cacheRoot,
    cachePath: join(cacheRoot, `${safeBase}-${hash}${ext}`),
  };
}

async function downloadRemoteFile(remotePath, cachePath) {
  const tmpPath = `${cachePath}.tmp`;
  await mkdir(dirname(cachePath), { recursive: true });

  await new Promise((resolve, reject) => {
    const scp = spawn("scp", [
      ...REMOTE_SSH_OPTIONS,
      remotePath ? `${REMOTE_DEMO_HOST}:${remotePath}` : "",
      tmpPath,
    ]);

    let stderr = "";
    scp.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    scp.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`SCP failed (code ${code}): ${stderr}`));
    });
    scp.on("error", reject);
  });

  await rename(tmpPath, cachePath);
}

async function ensureRemoteCache(filepath, remotePath, remoteSize) {
  const { cachePath } = getRemoteCachePath(filepath, remotePath);

  try {
    const cachedInfo = await stat(cachePath);
    if (!remoteSize || cachedInfo.size === remoteSize) {
      return { path: cachePath, info: cachedInfo, source: "remote-cache" };
    }
  } catch {
    // Cache miss.
  }

  let inFlight = downloadPromises.get(cachePath);
  if (!inFlight) {
    inFlight = (async () => {
      await mkdir(dirname(cachePath), { recursive: true });
      await downloadRemoteFile(remotePath, cachePath);
      return stat(cachePath);
    })().finally(() => {
      downloadPromises.delete(cachePath);
    });
    downloadPromises.set(cachePath, inFlight);
  }

  const info = await inFlight;
  return { path: cachePath, info, source: "remote-cache" };
}

export async function resolveDemoFileForRead(filepath, allowedPrefixes = ["private/uploads/demos/"]) {
  const localResult = await findExistingLocalPath(getDemoFileCandidatePaths(filepath, allowedPrefixes));
  if (localResult) {
    return { path: localResult.path, info: localResult.info, source: "local" };
  }

  const remoteResult = await resolveRemoteDemoFile(filepath);
  if (!remoteResult) return null;

  return ensureRemoteCache(filepath, remoteResult.remotePath, remoteResult.size);
}
