import prisma from "@/lib/prisma";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";
import { insertDiscordOutboxEvent } from "@/lib/discord-bridge-service";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: true });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        const type = String(auth.body?.type || "support").trim().toLowerCase();
        const details = String(auth.body?.details || auth.body?.message || "").trim();
        const releaseId = auth.body?.releaseId ? String(auth.body.releaseId).trim() : null;

        if (!details) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "details is required." }, 400);
        }

        if (details.length > 5000) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "details is too long (max 5000)." }, 400);
        }

        const request = await prisma.changeRequest.create({
            data: {
                type: type.slice(0, 64),
                details,
                status: "pending",
                userId: linked.user.id,
                releaseId: releaseId || null
            },
            include: {
                release: {
                    select: { id: true, name: true }
                }
            }
        });

        await insertDiscordOutboxEvent(
            "support_opened",
            {
                requestId: request.id,
                userId: linked.user.id,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                type: request.type,
                status: request.status,
                release: request.release,
                source: "discord"
            },
            request.id
        );

        await auth.finish({ status: 201, success: true });

        return discordInternalJson({
            success: true,
            request: {
                id: request.id,
                status: request.status,
                type: request.type,
                createdAt: request.createdAt,
                release: request.release
            },
            trackUrl: `/dashboard?view=my-support&id=${request.id}`
        }, 201);
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to open support ticket." }, 500);
    }
}
