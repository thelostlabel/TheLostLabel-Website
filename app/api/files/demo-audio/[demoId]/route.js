import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { extname, isAbsolute, join } from "path";
import { Readable } from "stream";

const MIME_BY_EXT = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
};

const resolveStoragePath = (filepath) => {
  if (!filepath) return null;
  const root = process.cwd();
  const candidate = isAbsolute(filepath)
    ? filepath
    : join(root, filepath.replace(/^\/+/, ""));
  if (!candidate.startsWith(root)) return null;
  return candidate;
};

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { demoId } = await params;
  if (!demoId) return new Response("Missing demo id", { status: 400 });

  const demo = await prisma.demo.findUnique({
    where: { id: demoId },
    include: { files: true },
  });

  if (!demo) return new Response("Not found", { status: 404 });

  const isAdminOrAR = session.user.role === "admin" || session.user.role === "a&r";
  if (!isAdminOrAR && demo.artistId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const audioFile = demo.files?.find((file) => {
    const ext = (file.filename || "").toLowerCase();
    return ext.endsWith(".mp3") || ext.endsWith(".wav") || ext.endsWith(".m4a");
  });

  if (!audioFile) return new Response("No audio file", { status: 404 });

  const filePath = resolveStoragePath(audioFile.filepath);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const fileStat = await stat(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `inline; filename="${audioFile.filename}"`,
      },
    });
  } catch (error) {
    console.error("Demo audio read error:", error);
    return new Response("File error", { status: 500 });
  }
}
