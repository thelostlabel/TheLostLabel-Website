import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, join } from "path";
import { Readable } from "stream";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const resolvePath = (filepath) => {
  if (!filepath || typeof filepath !== "string") return [];
  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];
  if (!normalized.startsWith("private/uploads/releases/")) return [];

  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";
  return [
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
  ];
};

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const releaseId = params?.releaseId;
  if (!releaseId) return new Response("Missing release id", { status: 400 });

  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    select: { image: true },
  });

  if (!release?.image) return new Response("Not found", { status: 404 });

  try {
    const candidates = resolvePath(release.image);
    let filePath = null;
    let info = null;
    for (const candidate of candidates) {
      try {
        const s = await stat(candidate);
        filePath = candidate;
        info = s;
        break;
      } catch {
        // Try next candidate path.
      }
    }

    if (!filePath || !info) return new Response("Not found", { status: 404 });

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": info.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="cover-${releaseId}${ext || ''}"`,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (err) {
    console.error("Release cover read error:", err);
    return new Response("File error", { status: 500 });
  }
}
