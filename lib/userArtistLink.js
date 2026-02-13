import prisma from './prisma';

/**
 * Links a User to an Artist profile if a match is found based on email or stage name.
 * This ensures that when a user is approved, they can see their related contracts/projects.
 * @param {string} userId - The ID of the User to link.
 */
export async function linkUserToArtist(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { artist: { select: { id: true } } }
        });

        if (!user) {
            console.log(`[LinkUtil] User ${userId} not found.`);
            return null;
        }
        if (user.artist?.id) {
            return user.artist;
        }

        const normalize = (value) => (value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        const normalizedStageName = normalize(user.stageName);

        // 1. Search for Artist by email first (strongest link)
        let artist = await prisma.artist.findFirst({
            where: {
                email: { equals: user.email, mode: 'insensitive' },
                userId: null // Only link if not already linked
            }
        });

        // 2. Fallback to Stage Name match if email didn't work
        if (!artist && user.stageName) {
            artist = await prisma.artist.findFirst({
                where: {
                    name: {
                        equals: user.stageName,
                        mode: 'insensitive'
                    },
                    userId: null
                }
            });
        }

        // 3. Normalized stage-name fallback (handles spaces, dots, underscores, etc.)
        if (!artist && normalizedStageName) {
            const candidates = await prisma.artist.findMany({
                where: { userId: null },
                select: { id: true, name: true, email: true },
                take: 500
            });

            artist = candidates.find((candidate) => normalize(candidate.name) === normalizedStageName) || null;
        }

        if (artist) {
            console.log(`[LinkUtil] Found match for User ${user.email} -> Artist ${artist.name} (${artist.id})`);

            // Link them
            const updatedArtist = await prisma.artist.update({
                where: { id: artist.id },
                data: { userId: user.id }
            });

            return updatedArtist;
        }

        console.log(`[LinkUtil] No matching Artist profile found for User ${user.email}`);
        return null;
    } catch (error) {
        console.error(`[LinkUtil] Error linking user ${userId}:`, error);
        return null;
    }
}
