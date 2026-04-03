import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { extname } from "path";
import { createFileWebStream } from "@/lib/file-stream-response";
import { resolveDemoFileForRead } from "@/lib/demo-file-storage";

const MIME_BY_EXT = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const ALLOWED_PREFIXES = [
  "private/uploads/demos/",
  "uploads/demos/",
];

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { fileId } = await params;
  if (!fileId) return new Response("Missing file id", { status: 400 });

  const demoFile = await prisma.demoFile.findUnique({
    where: { id: fileId },
    include: { demo: { select: { artistId: true } } },
  });

  if (!demoFile) return new Response("Not found", { status: 404 });

  const canViewAll = canViewAllDemos(session.user);
  const isOwner = demoFile.demo?.artistId === session.user.id;
  if (!canViewAll && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }
  if (isOwner && !hasPortalPermission(session.user, "view_demos")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const resolvedFile = await resolveDemoFileForRead(demoFile.filepath, ALLOWED_PREFIXES);
    if (!resolvedFile) {
      return new Response("Not found", { status: 404 });
    }

    const filePath = resolvedFile.path;
    const fileStat = resolvedFile.info;

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";
    const fileSize = fileStat.size;

    // Handle Range requests for audio seeking
    const rangeHeader = req.headers.get("range");
    if (rangeHeader && contentType.startsWith("audio/")) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        if (start >= fileSize) {
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${fileSize}` },
          });
        }

        const clampedEnd = Math.min(end, fileSize - 1);
        const chunkSize = clampedEnd - start + 1;

        const stream = createFileWebStream(filePath, req.signal, { start, end: clampedEnd });
        return new Response(stream, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": chunkSize.toString(),
            "Content-Range": `bytes ${start}-${clampedEnd}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Disposition": `inline; filename="${demoFile.filename}"`,
          },
        });
      }
    }

    const stream = createFileWebStream(filePath, req.signal);
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${demoFile.filename}"`,
      },
    });
  } catch (error) {
    console.error("Demo file read error:", error);
    return new Response("File error", { status: 500 });
  }
}
