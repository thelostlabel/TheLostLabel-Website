import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { stat } from "fs/promises";
import { extname, join } from "path";
import { spawn } from "child_process";
import { createFileWebStream } from "@/lib/file-stream-response";
import { resolvePrivateStorageCandidates } from "@/lib/private-storage-paths";

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

  // Security: never allow path traversal
  if (normalized.includes("..")) return [];

  // Accept known safe prefixes
  const isAllowed = ALLOWED_PREFIXES.some(p => normalized.startsWith(p));
  if (!isAllowed) {
    console.warn(`[demo-file] Rejected path (no allowed prefix): ${normalized}`);
    return [];
  }

  const candidates = resolvePrivateStorageCandidates(normalized, ALLOWED_PREFIXES);

  console.info(`[demo-file] Trying paths for "${normalized}":`, candidates);
  return candidates;
};

const getRemoteCandidatePaths = (filepath, remoteRoot) => {
  if (!filepath || !remoteRoot) return [];

  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];

  const relativeToApp = normalized;
  const relativeToPrivate = normalized.startsWith("private/")
    ? normalized.replace(/^private\/+/, "")
    : normalized;

  return Array.from(new Set([
    join(remoteRoot, relativeToApp),
    join(remoteRoot, relativeToPrivate),
  ]));
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
      // Local fallback for development: if file not found locally, stream via SSH if configured
      const remotePath = process.env.REMOTE_STORAGE_PATH;
      if (remotePath && process.env.NODE_ENV === "development") {
        const remoteCandidates = getRemoteCandidatePaths(demoFile.filepath, remotePath);
        const fullRemotePath = remoteCandidates[0];

        console.info(`[demo-file] Local file not found, trying SSH paths for "${demoFile.filepath}":`, remoteCandidates);

        const ext = extname(demoFile.filepath).toLowerCase();
        const contentType = MIME_BY_EXT[ext] || "audio/mpeg";

        const { execFile } = await import("child_process");
        const execFileAsync = (...args) =>
          new Promise((resolve, reject) => {
            execFile(...args, (error, stdout, stderr) => {
              if (error) {
                reject(Object.assign(error, { stdout, stderr }));
                return;
              }
              resolve({ stdout, stderr });
            });
          });

        let fileSize = null;
        let resolvedRemotePath = null;

        for (const candidate of remoteCandidates) {
          try {
            const { stdout } = await execFileAsync("ssh", [
              "-o", "StrictHostKeyChecking=no",
              "-o", "BatchMode=yes",
              "-o", "ConnectTimeout=5",
              "root@152.53.142.222",
              "stat",
              "-c%s",
              candidate,
            ]);
            resolvedRemotePath = candidate;
            fileSize = parseInt(String(stdout).trim(), 10);
            break;
          } catch (err) {
            console.warn(`[demo-file] Remote candidate missing or inaccessible: ${candidate}`);
          }
        }

        if (!resolvedRemotePath) {
          console.warn(`[demo-file] No SSH candidate resolved for "${demoFile.filepath}" from root "${remotePath}"`);
          return new Response("Not found", { status: 404 });
        }

        console.info(`[demo-file] Streaming via SSH from: ${resolvedRemotePath}`);

        const rangeHeader = req.headers.get("range");
        let sshCommand = `cat "${resolvedRemotePath}"`;
        let status = 200;
        const responseHeaders = {
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Content-Disposition": `inline; filename="${demoFile.filename}"`,
        };

        if (rangeHeader && fileSize) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            
            // Use tail and head for byte-range seeking over SSH
            sshCommand = `tail -c +${start + 1} "${resolvedRemotePath}" | head -c ${chunkSize}`;
            status = 206;
            responseHeaders["Content-Range"] = `bytes ${start}-${end}/${fileSize}`;
            responseHeaders["Content-Length"] = chunkSize.toString();
          }
        } else if (fileSize) {
          responseHeaders["Content-Length"] = fileSize.toString();
        }
        
        const sshProcess = spawn("ssh", [
          "-o", "StrictHostKeyChecking=no",
          "-o", "BatchMode=yes",
          "-o", "ConnectTimeout=5",
          "root@152.53.142.222", 
          sshCommand
        ]);

        let stderr = "";
        sshProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        sshProcess.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`[demo-file] SSH failed with code ${code}. Stderr: ${stderr}`);
          }
        });

        return new Response(sshProcess.stdout, { 
          status,
          headers: responseHeaders 
        });
      }
      return new Response("Not found", { status: 404 });
    }

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
