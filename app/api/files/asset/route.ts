import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewAllDemos, hasPortalPermission } from "@/lib/permissions";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";
import { stat } from "fs/promises";
import { extname } from "path";
import { createFileWebStream } from "@/lib/file-stream-response";
import { resolvePrivateStorageCandidates } from "@/lib/private-storage-paths";
import { resolveArtistContextForUser } from "@/lib/artist-identity";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
};

function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function getPathVariants(normalized: string): string[] {
  const variants = new Set([normalized]);

  if (normalized.startsWith("private/")) {
    variants.add(normalized.replace(/^private\/+/, ""));
  } else {
    variants.add(`private/${normalized}`);
  }

  return Array.from(variants);
}

const resolvePath = (filepath: string | null | undefined): string[] => {
  if (!filepath || typeof filepath !== "string") return [];
  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];
  if (!normalized.startsWith("private/uploads/")) return [];

  return resolvePrivateStorageCandidates(normalized, ["private/uploads/"]);
};

interface ContractForAccess {
  userId?: string | null;
  primaryArtistEmail?: string | null;
  artist?: { userId?: string | null; email?: string | null } | null;
  splits?: Array<{
    userId?: string | null;
    email?: string | null;
    user?: { email?: string | null } | null;
  }>;
}

interface SessionUser {
  id?: string;
  email?: string | null;
  role?: string;
}

function hasContractAccess(user: SessionUser | null | undefined, contract: ContractForAccess): boolean {
  const isAdminOrAR = user?.role === "admin" || user?.role === "a&r";
  if (isAdminOrAR) return true;

  const userEmail = normalizeEmail(user?.email);
  return contract.userId === user?.id ||
    contract.artist?.userId === user?.id ||
    normalizeEmail(contract.primaryArtistEmail) === userEmail ||
    normalizeEmail(contract.artist?.email) === userEmail ||
    (contract.splits?.some((split) =>
      split.userId === user?.id ||
      normalizeEmail(split.email) === userEmail ||
      normalizeEmail(split.user?.email) === userEmail
    ) ?? false);
}

export function ownsDemoFileAsset({
  viewerUserId,
  viewerArtistProfileId,
  demoUserId,
  demoArtistProfileId,
}: {
  viewerUserId: string | null;
  viewerArtistProfileId: string | null;
  demoUserId: string | null;
  demoArtistProfileId: string | null;
}): boolean {
  return Boolean(
    (viewerUserId && demoUserId && viewerUserId === demoUserId) ||
    (viewerArtistProfileId && demoArtistProfileId && viewerArtistProfileId === demoArtistProfileId)
  );
}

async function canAccessAsset(user: SessionUser | null | undefined, normalizedPath: string): Promise<{ allowed: boolean; status?: number }> {
  const variants = getPathVariants(normalizedPath);

  if (normalizedPath.startsWith("private/uploads/demos/")) {
    const demoFile = await prisma.demoFile.findFirst({
      where: { filepath: { in: variants } },
      include: {
        demo: {
          select: {
            artistId: true,
            artistProfileId: true,
          },
        },
      },
    });

    if (!demoFile) return { allowed: false, status: 404 };

    const canViewAll = canViewAllDemos(user);
    const artistContext = !canViewAll && user?.id
      ? await resolveArtistContextForUser(user.id)
      : null;
    const isOwner = ownsDemoFileAsset({
      viewerUserId: user?.id || null,
      viewerArtistProfileId: artistContext?.artistId || null,
      demoUserId: demoFile.demo?.artistId || null,
      demoArtistProfileId: demoFile.demo?.artistProfileId || null,
    });
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError) {
    return new Response(accessError, { status: 403 });
  }

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
    let filePath: string | null = null;
    let info: Awaited<ReturnType<typeof stat>> | null = null;
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
    const stream = createFileWebStream(filePath, req.signal);
    const isDownload = searchParams.get("download") === "1";

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": info.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="asset${ext || ""}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Asset file error:", error instanceof Error ? error.message : "Unknown error");
    return new Response("File error", { status: 500 });
  }
}
