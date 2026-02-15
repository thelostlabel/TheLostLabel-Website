import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, isAbsolute, join } from "path";
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

    if (isAbsolute(filepath)) {
        return [filepath];
    }

    if (normalized.startsWith("private/")) {
        return [
            join(root, normalized),
            join(appRoot, normalized),
            join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
        ];
    }

    return [
        join(root, normalized),
        join(appRoot, normalized),
        join(configuredPrivateRoot, normalized),
    ];
};

export async function GET(req, { params }) {
    const { fileId } = await params;
    if (!fileId) return new Response("Missing demo id", { status: 400 });

    try {
        const demo = await prisma.demo.findUnique({
            where: { id: fileId },
            include: { files: true }
        });

        if (!demo || !demo.files) return new Response("Not found", { status: 404 });

        const audioFile = demo.files.find(f =>
            f.filename.endsWith('.mp3') ||
            f.filename.endsWith('.wav') ||
            f.filename.endsWith('.m4a')
        );

        if (!audioFile) return new Response("Audio file not found", { status: 404 });

        const candidates = getCandidatePaths(audioFile.filepath);
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
