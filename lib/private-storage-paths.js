import { join } from "path";

export function resolvePrivateStorageCandidates(filepath, allowedPrefixes) {
  if (!filepath || typeof filepath !== "string") return [];

  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];

  if (allowedPrefixes?.length) {
    const isAllowed = allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
    if (!isAllowed) return [];
  }

  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";
  const storageRelativePath = normalized.startsWith("private/")
    ? normalized.replace(/^private\/+/, "")
    : normalized;

  return Array.from(new Set([
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, storageRelativePath),
  ]));
}
