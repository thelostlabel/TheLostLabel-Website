import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { fetchDemosForUser, resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        const demos = await fetchDemosForUser(linked.user);

        const counts = demos.reduce((acc, demo) => {
            const key = demo.status || "unknown";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            linked: true,
            user: {
                id: linked.user.id,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                role: linked.user.role
            },
            counts,
            items: demos.map((demo) => ({
                id: demo.id,
                title: demo.title,
                genre: demo.genre,
                status: demo.status,
                trackLink: demo.trackLink,
                message: demo.message,
                reviewedAt: demo.reviewedAt,
                rejectionReason: demo.rejectionReason,
                createdAt: demo.createdAt,
                files: (demo.files || []).map((file) => ({
                    id: file.id,
                    filename: file.filename,
                    filesize: file.filesize
                }))
            }))
        });
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to fetch demo status." }, 500);
    }
}
