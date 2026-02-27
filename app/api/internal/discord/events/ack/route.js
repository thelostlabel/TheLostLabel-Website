import prisma from "@/lib/prisma";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: true });
    if (!auth.ok) return auth.response;

    try {
        const results = Array.isArray(auth.body?.results) ? auth.body.results : [];
        if (!results.length) {
            await auth.finish({ status: 400, success: false });
            return discordInternalJson({ error: "results array is required." }, 400);
        }

        for (const result of results) {
            const id = Number(result?.id);
            if (!Number.isFinite(id)) continue;

            if (result.success) {
                await prisma.$executeRaw`
                    UPDATE discord_event_outbox
                    SET
                        status = 'sent',
                        last_error = NULL,
                        updated_at = NOW()
                    WHERE id = ${id}
                `;
                continue;
            }

            const errorText = String(result?.error || "Unknown delivery error").slice(0, 1500);
            const permanent = Boolean(result?.permanent);

            if (permanent) {
                await prisma.$executeRaw`
                    UPDATE discord_event_outbox
                    SET
                        status = 'failed',
                        last_error = ${errorText},
                        updated_at = NOW()
                    WHERE id = ${id}
                `;
                continue;
            }

            const row = await prisma.$queryRaw`
                SELECT attempts
                FROM discord_event_outbox
                WHERE id = ${id}
                LIMIT 1
            `;
            const attempts = Number(row?.[0]?.attempts || 1);
            const retryDelaySeconds = Math.min(3600, Math.max(20, Math.pow(2, attempts) * 15));

            await prisma.$executeRaw`
                UPDATE discord_event_outbox
                SET
                    status = 'pending',
                    last_error = ${errorText},
                    next_attempt_at = NOW() + (${retryDelaySeconds} * INTERVAL '1 second'),
                    updated_at = NOW()
                WHERE id = ${id}
            `;
        }

        await auth.finish({ status: 200, success: true });
        return discordInternalJson({ success: true });
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to ack events." }, 500);
    }
}
