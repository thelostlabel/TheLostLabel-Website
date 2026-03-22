import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import { stat } from "fs/promises";
import { extname } from "path";
import prisma from "@/lib/prisma";
import { resolvePrivateStorageCandidates } from "@/lib/private-storage-paths";
import { getCachedWavWaveform } from "@/lib/wav-waveform";

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

    const ext = extname(demoFile.filename || "").toLowerCase();
    if (ext !== ".wav") {
      return new Response(JSON.stringify({ error: "Waveform metadata is only available for WAV demos." }), {
        status: 415,
        headers: { "Content-Type": "application/json" },
      });
    }

    const candidates = getCandidatePaths(demoFile.filepath);
    let filePath = null;

    for (const candidate of candidates) {
      try {
        await stat(candidate);
        filePath = candidate;
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (!filePath) {
      return new Response("File not found", { status: 404 });
    }

    const url = new URL(req.url);
    const requestedPeaks = Number.parseInt(url.searchParams.get("peaks") || "", 10);
    const peakCount = Number.isFinite(requestedPeaks)
      ? Math.min(2000, Math.max(64, requestedPeaks))
      : 640;

    const waveform = await getCachedWavWaveform(filePath, peakCount);

    return new Response(JSON.stringify(waveform), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    console.error("Waveform metadata error:", error);
    return new Response("Waveform error", { status: 500 });
  }
}
