import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { extname, join } from "path";
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getPathVariants(normalized) {
  const variants = new Set([normalized]);

  if (normalized.startsWith("private/")) {
    variants.add(normalized.replace(/^private\/+/, ""));
  } else {
    variants.add(`private/${normalized}`);
  }

  return Array.from(variants);
}

const resolvePath = (filepath) => {
  if (!filepath || typeof filepath !== "string") return [];
  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];
  if (!normalized.startsWith("private/uploads/")) return [];

  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";
  return [
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
  ];
};

function hasContractAccess(user, contract) {
  const isAdminOrAR = user?.role === "admin" || user?.role === "a&r";
  if (isAdminOrAR) return true;

  const userEmail = normalizeEmail(user?.email);
  return contract.userId === user?.id ||
    contract.artist?.userId === user?.id ||
    normalizeEmail(contract.primaryArtistEmail) === userEmail ||
    normalizeEmail(contract.artist?.email) === userEmail ||
    contract.splits?.some((split) =>
      split.userId === user?.id ||
      normalizeEmail(split.email) === userEmail ||
      normalizeEmail(split.user?.email) === userEmail
    );
}

async function canAccessAsset(user, normalizedPath) {
  const variants = getPathVariants(normalizedPath);

  if (normalizedPath.startsWith("private/uploads/demos/")) {
    const demoFile = await prisma.demoFile.findFirst({
      where: { filepath: { in: variants } },
      include: {
        demo: {
          select: {
            artistId: true,
          },
        },
      },
    });

    if (!demoFile) return { allowed: false, status: 404 };

    const canViewAll = canViewAllDemos(user);
    const isOwner = demoFile.demo?.artistId === user?.id;
    if (!canViewAll && !isOwner) return { allowed: false, status: 403 };
    if (isOwner && !hasPortalPermission(user, "view_demos")) {
      return { allowed: false, status: 403 };
    }

    return { allowed: true };
  }

  if (normalizedPath.startsWith("private/uploads/contracts/")) {
    const contract = await prisma.contract.findFirst({
      where: { pdfUrl: { in: variants } },
      include: {
        artist: {
          select: {
            userId: true,
            email: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!contract) return { allowed: false, status: 404 };
    const isAdminOrAR = user?.role === "admin" || user?.role === "a&r";
    if (!isAdminOrAR) return { allowed: false, status: 403 };
    return hasContractAccess(user, contract)
      ? { allowed: true }
      : { allowed: false, status: 403 };
  }

  if (normalizedPath.startsWith("private/uploads/releases/")) {
    const release = await prisma.release.findFirst({
      where: { image: { in: variants } },
      select: {
        id: true,
        contracts: {
          select: {
            userId: true,
            primaryArtistEmail: true,
            artist: {
              select: {
                userId: true,
                email: true,
              },
            },
            splits: {
              select: {
                userId: true,
                email: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!release) return { allowed: false, status: 404 };

    const isAdminOrAR = user?.role === "admin" || user?.role === "a&r";
    if (isAdminOrAR) return { allowed: true };

    const hasAccess = release.contracts.some((contract) => hasContractAccess(user, contract));
    return hasAccess
      ? { allowed: true }
      : { allowed: false, status: 403 };
  }

  return { allowed: false, status: 404 };
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const pathParam = searchParams.get("path");
  if (!pathParam) return new Response("Missing path", { status: 400 });

  try {
    const normalizedPath = String(pathParam || "").replace(/^\/+/, "");
    const access = await canAccessAsset(session.user, normalizedPath);
    if (!access.allowed) {
      return new Response(access.status === 404 ? "Not found" : "Forbidden", { status: access.status });
    }

    const candidates = resolvePath(normalizedPath);
    let filePath = null;
    let info = null;
    for (const candidate of candidates) {
      try {
        const s = await stat(candidate);
        filePath = candidate;
        info = s;
        break;
      } catch {
        // Try next candidate path.
      }
    }

    if (!filePath || !info) return new Response("Not found", { status: 404 });

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));
    const isDownload = searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": info.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="asset${ext || ""}"`,
      },
    });
  } catch (error) {
    console.error("Asset file error:", error);
    return new Response("File error", { status: 500 });
  }
}
