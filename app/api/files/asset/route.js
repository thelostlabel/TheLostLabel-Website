import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, isAbsolute, join } from "path";
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
  if (!filepath) return null;
  const root = process.cwd();
  const candidate = isAbsolute(filepath)
    ? filepath
    : join(root, filepath.replace(/^\/+/, ""));
  if (!candidate.startsWith(join(root, "private"))) return null;
  return candidate;
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const pathParam = searchParams.get("path");
  if (!pathParam) return new Response("Missing path", { status: 400 });

  const filePath = resolvePath(pathParam);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(filePath);
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
