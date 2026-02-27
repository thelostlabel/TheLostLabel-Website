import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";

const limiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 500
});

const MAX_FILE_BYTES = 100 * 1024 * 1024;

function safeFilename(name) {
    return String(name || "demo.wav").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isAllowedDiscordHost(url) {
    try {
        const parsed = new URL(url);
        return ["cdn.discordapp.com", "media.discordapp.net", "attachments.discordapp.net"].includes(parsed.hostname);
    } catch {
        return false;
    }
}

function inferFileName(body) {
    const explicit = body?.fileName || body?.filename;
    if (explicit) return safeFilename(explicit);

    const fileUrl = body?.fileUrl || body?.file_url;
    if (!fileUrl) return "discord_demo.wav";

    try {
        const parsed = new URL(fileUrl);
        const tail = parsed.pathname.split("/").pop();
        return safeFilename(tail || "discord_demo.wav");
    } catch {
        return "discord_demo.wav";
    }
}

async function downloadDiscordFile(fileUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
        const response = await fetch(fileUrl, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`File download failed with status ${response.status}`);
        }

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > MAX_FILE_BYTES) {
            throw new Error("File too large (max 100MB).");
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > MAX_FILE_BYTES) {
            throw new Error("File too large (max 100MB).");
        }

        return {
            buffer,
            contentType: response.headers.get("content-type") || null,
            size: buffer.length
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function persistDemoFile(filename, buffer) {
    const storageRoot = process.env.PRIVATE_STORAGE_ROOT
        ? resolve(process.env.PRIVATE_STORAGE_ROOT)
        : join(process.cwd(), "private");

    const demoDir = join(storageRoot, "uploads", "demos");
    await mkdir(demoDir, { recursive: true });

    const uniqueName = `${randomUUID()}_${safeFilename(filename)}`;
    const fullPath = join(demoDir, uniqueName);
    await writeFile(fullPath, buffer);

    return {
        filepath: `private/uploads/demos/${uniqueName}`,
        filesize: buffer.length,
        filename: safeFilename(filename)
    };
}

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: true });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        try {
            await limiter.check(null, 8, `discord-demo:${linked.user.id}`);
        } catch {
            await auth.finish({ status: 429, success: false });
            return discordInternalJson({ error: "Rate limit exceeded." }, 429);
        }

        const title = String(auth.body?.title || "").trim();
        const genre = String(auth.body?.genre || "").trim() || null;
        const message = String(auth.body?.message || "").trim() || null;
        const trackLink = String(auth.body?.trackLink || auth.body?.track_link || "").trim() || null;
        const fileUrl = String(auth.body?.fileUrl || auth.body?.file_url || "").trim() || null;

        if (!title) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "title is required." }, 400);
        }

        if (!trackLink && !fileUrl) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "trackLink or fileUrl is required." }, 400);
        }

        let fileRecord = null;
        if (fileUrl) {
            if (!isAllowedDiscordHost(fileUrl)) {
                await auth.finish({ status: 400, success: false });
                return discordInternalJson({ error: "Only Discord attachment URLs are allowed." }, 400);
            }

            const filename = inferFileName(auth.body || {});
            const downloaded = await downloadDiscordFile(fileUrl);
            fileRecord = await persistDemoFile(filename, downloaded.buffer);
        }

        const sourceMeta = [
            "[SOURCE:DISCORD]",
            `discord_user_id=${linked.discordUserId}`,
            auth.guildId ? `guild_id=${auth.guildId}` : null
        ].filter(Boolean).join(" ");

        const demo = await prisma.demo.create({
            data: {
                title: title.slice(0, 100),
                genre,
                trackLink,
                message: [sourceMeta, message].filter(Boolean).join("\n"),
                artist: {
                    connect: { id: linked.user.id }
                },
                files: fileRecord
                    ? {
                        create: {
                            filename: fileRecord.filename,
                            filepath: fileRecord.filepath,
                            filesize: fileRecord.filesize
                        }
                    }
                    : undefined
            },
            include: {
                files: true
            }
        });

        await insertDiscordOutboxEvent(
            "demo_submitted",
            {
                demoId: demo.id,
                title: demo.title,
                genre: demo.genre,
                status: demo.status,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                source: "discord"
            },
            demo.id
        );

        await auth.finish({ status: 201, success: true });

        return discordInternalJson({
            success: true,
            demo: {
                id: demo.id,
                title: demo.title,
                status: demo.status,
                createdAt: demo.createdAt
            },
            trackUrl: `/dashboard?view=my-demos`
        }, 201);
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to submit demo." }, 500);
    }
}
