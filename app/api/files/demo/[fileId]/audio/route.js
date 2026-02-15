import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, join } from "path";
import { Readable } from "stream";
import prisma from "@/lib/prisma";

const MIME_BY_EXT = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
};

const getCandidatePaths = (filepath) => {
    if (!filepath) return [];
    const normalized = filepath.replace(/^\/+/, "");
    const root = process.cwd();
    const appRoot = "/app";
    const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";

    if (normalized.includes("..")) return [];
    if (!normalized.startsWith("private/uploads/demos/")) return [];

    return [
        join(root, normalized),
        join(appRoot, normalized),
        join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
    ];
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

        const isAdminOrAR = session.user.role === "admin" || session.user.role === "a&r";
        if (!isAdminOrAR && demoFile.demo?.artistId !== session.user.id) {
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
        const stream = Readable.toWeb(createReadStream(filePath));

        return new Response(stream, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": info.size.toString(),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (err) {
        console.error("Audio read error:", err);
        return new Response("File error", { status: 500 });
    }
}
