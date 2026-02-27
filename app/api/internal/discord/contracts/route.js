import { authenticateDiscordInternalRequest, discordInternalJson } from "@/lib/discord-bridge-auth";
import { fetchContractsForUser, resolveLinkedSiteUser } from "@/lib/discord-bridge-internal";

export async function POST(req) {
    const auth = await authenticateDiscordInternalRequest(req, { requireJsonBody: false });
    if (!auth.ok) return auth.response;

    try {
        const linked = await resolveLinkedSiteUser(auth, auth.body || {});
        if (!linked.ok) {
            await auth.finish({ status: linked.status, success: false });
            return discordInternalJson({ error: linked.error }, linked.status);
        }

        const contracts = await fetchContractsForUser(linked.user);

        await auth.finish({ status: 200, success: true });

        return discordInternalJson({
            linked: true,
            user: {
                id: linked.user.id,
                stageName: linked.user.stageName || linked.user.fullName || linked.user.email,
                role: linked.user.role
            },
            items: contracts.map((contract) => ({
                id: contract.id,
                title: contract.title || contract.release?.name || "Untitled Contract",
                status: contract.status,
                artistShare: Number(contract.artistShare || 0),
                labelShare: Number(contract.labelShare || 0),
                release: contract.release
                    ? {
                        id: contract.release.id,
                        name: contract.release.name,
                        spotifyUrl: contract.release.spotifyUrl,
                        releaseDate: contract.release.releaseDate
                    }
                    : null,
                splits: (contract.splits || []).map((split) => ({
                    name: split.name,
                    percentage: Number(split.percentage || 0)
                })),
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt
            }))
        });
    } catch (error) {
        await auth.finish({ status: 500, success: false });
        return discordInternalJson({ error: error.message || "Failed to fetch contracts." }, 500);
    }
}
