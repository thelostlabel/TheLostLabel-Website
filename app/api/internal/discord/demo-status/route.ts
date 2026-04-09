import { NextRequest } from "next/server";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { fetchDemosForUser, resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";

export async function POST(req: NextRequest): Promise<Response> {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        const demos = await fetchDemosForUser(linked.user);

        const counts = demos.reduce((acc: Record<string, number>, demo: Record<string, unknown>) => {
            const key = (demo.status as string) || "unknown";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            linked: true,
            user: {
                id: linked.user.id,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                role: linked.user.role
            },
            counts,
            items: demos.map((demo: Record<string, unknown>) => ({
                id: demo.id,
                title: demo.title,
                genre: demo.genre,
                status: demo.status,
                trackLink: demo.trackLink,
                message: demo.message,
                reviewedAt: demo.reviewedAt,
                rejectionReason: demo.rejectionReason,
                createdAt: demo.createdAt,
                files: ((demo.files as Array<Record<string, unknown>>) || []).map((file) => ({
                    id: file.id,
                    filename: file.filename,
                    filesize: file.filesize
                }))
            }))
        });
    } catch (error: unknown) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error instanceof Error ? error.message : "Failed to fetch demo status." }, 500);
    }
}
