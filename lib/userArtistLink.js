import prisma from './prisma';

/**
 * Links a User to an Artist profile if a match is found based on email or stage name.
 * This ensures that when a user is approved, they can see their related contracts/projects.
 * @param {string} userId - The ID of the User to link.
 */
export async function linkUserToArtist(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.log(`[LinkUtil] User ${userId} not found.`);
            return null;
        }

        // 1. Search for Artist by email first (strongest link)
        let artist = await prisma.artist.findFirst({
            where: {
                email: user.email,
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
