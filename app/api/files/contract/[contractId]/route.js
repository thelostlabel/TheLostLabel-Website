import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { extname, isAbsolute, join } from "path";
import { Readable } from "stream";

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
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

  const contractId = params?.contractId;
  if (!contractId) return new Response("Missing contract id", { status: 400 });

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      splits: { select: { userId: true } },
      artist: { select: { userId: true } },
    },
  });

  if (!contract) return new Response("Not found", { status: 404 });

  const isAdminOrAR = session.user.role === "admin" || session.user.role === "a&r";
  const isOwner = contract.userId && contract.userId === session.user.id;
  const isArtist = contract.artist?.userId && contract.artist.userId === session.user.id;
  const isSplit = contract.splits?.some((s) => s.userId === session.user.id);
  const isPrimaryEmail = contract.primaryArtistEmail && contract.primaryArtistEmail === session.user.email;

  if (!isAdminOrAR && !isOwner && !isArtist && !isSplit && !isPrimaryEmail) {
    return new Response("Forbidden", { status: 403 });
  }

  const filePath = resolveStoragePath(contract.pdfUrl);
  if (!filePath) return new Response("Not found", { status: 404 });

  try {
    const fileStat = await stat(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="contract-${contract.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Contract file read error:", error);
    return new Response("File error", { status: 500 });
  }
}
