import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import { stat } from "fs/promises";
import { extname } from "path";
import prisma from "@/lib/prisma";
import { createFileWebStream } from "@/lib/file-stream-response";
import { resolvePrivateStorageCandidates } from "@/lib/private-storage-paths";

const MIME_BY_EXT = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
};

const getCandidatePaths = (filepath) => {
    if (!filepath) return [];
    const normalized = filepath.replace(/^\/+/, "");

    if (normalized.includes("..")) return [];
    if (!normalized.startsWith("private/uploads/demos/")) return [];

    return resolvePrivateStorageCandidates(normalized, ["private/uploads/demos/"]);
};

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { fileId } = await params;
    if (!fileId) return new Response("Missing file id", { status: 400 });

    try {
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

        const extFromName = extname(demoFile.filename || "").toLowerCase();
        if (!MIME_BY_EXT[extFromName]) {
            return new Response("Audio file not found", { status: 404 });
        }

        const candidates = getCandidatePaths(demoFile.filepath);
        let filePath = null;
        let info = null;
        for (const candidate of candidates) {
            try {
                const s = await stat(candidate);
                filePath = candidate;
                info = s;
                break;
            } catch {
                // Try next candidate.
            }
        }
        if (!filePath || !info) return new Response("File not found", { status: 404 });

        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
        const fileSize = info.size;

        // Handle Range requests for audio seeking
        const rangeHeader = req.headers.get("range");
        if (rangeHeader) {
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
                        "Cache-Control": "private, no-store",
                        "Vary": "Cookie",
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
                "Cache-Control": "private, no-store",
                "Vary": "Cookie",
            },
        });
    } catch (err) {
        console.error("Audio read error:", err);
        return new Response("File error", { status: 500 });
    }
}
