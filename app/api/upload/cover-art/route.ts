import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { extname, join, resolve } from "path";
import { randomUUID } from "crypto";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function normalizeEmail(value: string | null | undefined): string {
    return String(value || "").trim().toLowerCase();
}

interface ContractWithAccess {
    userId: string | null;
    primaryArtistEmail?: string | null;
    artist?: {
        userId: string | null;
        email: string | null;
    } | null;
    splits?: Array<{
        userId: string | null;
        email: string | null;
        user?: {
            email: string | null;
        } | null;
    }>;
}

interface SessionUser {
    id: string;
    email?: string | null;
    role?: string;
}

function hasContractAccess(user: SessionUser | null | undefined, contract: ContractWithAccess): boolean {
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

function safeFilename(name: string | null | undefined): string {
    return String(name || "cover-image")
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^\.+/, "")
        .slice(0, 120) || "cover-image";
}

function hasAllowedImageSignature(buffer: Buffer, ext: string): boolean {
    if (!buffer?.length) return false;

    if (ext === ".png") {
        return buffer.length >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4E &&
            buffer[3] === 0x47;
    }

    if (ext === ".jpg" || ext === ".jpeg") {
        return buffer.length >= 3 &&
            buffer[0] === 0xFF &&
            buffer[1] === 0xD8 &&
            buffer[2] === 0xFF;
    }

    if (ext === ".webp") {
        return buffer.length >= 12 &&
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP";
    }

    return false;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const releaseIdValue = formData.get("releaseId");

        if (!file || typeof (file as File).arrayBuffer !== "function" || typeof (file as File).name !== "string" || typeof releaseIdValue !== "string") {
            return new Response("Missing file or releaseId", { status: 400 });
        }

        const typedFile = file as File;
        const releaseId = releaseIdValue.trim();
        if (!releaseId) {
            return new Response("Missing file or releaseId", { status: 400 });
        }

        const release = await prisma.release.findUnique({
            where: { id: releaseId },
            select: {
                id: true,
                contracts: {
                    select: {
                        userId: true,
                        primaryArtistEmail: true,
                        artist: {
                            select: {
                                userId: true,
                                email: true
                            }
                        },
                        splits: {
                            select: {
                                userId: true,
                                email: true,
                                user: {
                                    select: {
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!release) {
            return new Response("Release not found", { status: 404 });
        }

        const isAdminOrAR = session.user?.role === "admin" || session.user?.role === "a&r";
        const canManageRelease = isAdminOrAR || release.contracts.some((contract) => hasContractAccess(session.user, contract));
        if (!canManageRelease) {
            return new Response("Forbidden", { status: 403 });
        }

        if (!typedFile.type?.startsWith("image/")) {
            return new Response("Invalid image type", { status: 400 });
        }
        if (typedFile.size > MAX_IMAGE_BYTES) {
            return new Response("Image too large (max 10MB)", { status: 400 });
        }

        const safeOriginalName = safeFilename(typedFile.name);
        const ext = extname(safeOriginalName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return new Response("Unsupported image format", { status: 400 });
        }

        const bytes = await typedFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        if (!hasAllowedImageSignature(buffer, ext)) {
            return new Response("Invalid image file", { status: 400 });
        }

        const storageRoot = process.env.PRIVATE_STORAGE_ROOT
            ? resolve(process.env.PRIVATE_STORAGE_ROOT)
            : join(process.cwd(), "private");
        const uploadDir = join(storageRoot, "uploads", "releases");
        await mkdir(uploadDir, { recursive: true });

        const safeReleaseId = releaseId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `${safeReleaseId}_${Date.now()}_${randomUUID()}_${safeOriginalName}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const imageUrl = `private/uploads/releases/${filename}`;

        await prisma.release.update({
            where: { id: releaseId },
            data: { image: imageUrl }
        });

        return new Response(JSON.stringify({ success: true, url: imageUrl }), { status: 200 });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500 });
    }
}
