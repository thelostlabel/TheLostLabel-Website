import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { extname, join } from "path";
import { Readable } from "stream";

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

const getCandidatePaths = (filepath) => {
  if (!filepath) return [];
  const normalized = filepath.replace(/^\/+/, "");
  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";

  // Security: never allow path traversal
  if (normalized.includes("..")) return [];

  // Accept known safe prefixes
  const isAllowed = ALLOWED_PREFIXES.some(p => normalized.startsWith(p));
  if (!isAllowed) {
    console.warn(`[demo-file] Rejected path (no allowed prefix): ${normalized}`);
    return [];
  }

  const candidates = [
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
    // Also try stripping 'private/' prefix directly against storage root
    join(configuredPrivateRoot, normalized.replace(/^private\/uploads\/demos\//, "uploads/demos/")),
  ];

  console.info(`[demo-file] Trying paths for "${normalized}":`, candidates);
  return candidates;
};

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
    const candidates = getCandidatePaths(demoFile.filepath);
    let filePath = null;
    let fileStat = null;

    for (const candidate of candidates) {
      try {
        const s = await stat(candidate);
        filePath = candidate;
        fileStat = s;
        break;
      } catch {
        // Try next candidate path.
      }
    }

    if (!filePath || !fileStat) {
      return new Response("Not found", { status: 404 });
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${demoFile.filename}"`,
      },
    });
  } catch (error) {
    console.error("Demo file read error:", error);
    return new Response("File error", { status: 500 });
  }
}
