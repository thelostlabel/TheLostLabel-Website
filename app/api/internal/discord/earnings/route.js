import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { fetchArtistEarningsForUser, resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        const earnings = await fetchArtistEarningsForUser(linked.user);

        let totalAvailable = 0;
        let totalPaid = 0;

        const items = earnings.map((item) => {
            const amount = Number(item.artistAmount || 0);
            if (item.paidToArtist) totalPaid += amount;
            else totalAvailable += amount;

            return {
                id: item.id,
                period: item.period,
                amount,
                currency: item.currency || "USD",
                grossAmount: Number(item.grossAmount || 0),
                status: item.paidToArtist ? "paid" : "available",
                release: item.contract?.release?.name || item.contract?.title || "Untitled Release",
                releaseId: item.contract?.release?.id || null,
                releaseUrl: item.contract?.release?.spotifyUrl || null,
                createdAt: item.createdAt
            };
        });

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            linked: true,
            user: {
                id: linked.user.id,
                email: linked.user.email,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                role: linked.user.role
            },
            summary: {
                totalAvailable,
                totalPaid,
                total: totalAvailable + totalPaid,
                currency: "USD"
            },
            items
        });
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to fetch earnings." }, 500);
    }
}
