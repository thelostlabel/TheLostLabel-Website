import { NextRequest } from "next/server";
import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { fetchArtistEarningsForUser, resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";

export async function POST(req: NextRequest) {
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

        const items = earnings.map((item: Record<string, unknown>) => {
            const amount = Number((item as Record<string, unknown>).artistAmount || 0);
            if (item.paidToArtist) totalPaid += amount;
            else totalAvailable += amount;

            const contract = item.contract as Record<string, unknown> | undefined;
            const release = contract?.release as Record<string, unknown> | undefined;

            return {
                id: item.id,
                period: item.period,
                amount,
                currency: item.currency || "USD",
                grossAmount: Number(item.grossAmount || 0),
                status: item.paidToArtist ? "paid" : "available",
                release: release?.name || contract?.title || "Untitled Release",
                releaseId: release?.id || null,
                releaseUrl: release?.spotifyUrl || null,
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
    } catch (error: unknown) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
}
