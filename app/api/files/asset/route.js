import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, join } from "path";
import { Readable } from "stream";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
};

const resolvePath = (filepath) => {
  if (!filepath || typeof filepath !== "string") return [];
  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];
  if (!normalized.startsWith("private/uploads/")) return [];

  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";
  return [
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
  ];
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const pathParam = searchParams.get("path");
  if (!pathParam) return new Response("Missing path", { status: 400 });

  try {
    const candidates = resolvePath(pathParam);
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
    const isDownload = searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": info.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="asset${ext || ''}"`,
      },
    });
  } catch (error) {
    console.error("Asset file error:", error);
    return new Response("File error", { status: 500 });
  }
}
