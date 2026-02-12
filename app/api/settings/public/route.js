import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            // Default fallback if no settings exist
            return new Response(JSON.stringify({
                genres: ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Phonk', 'Brazilian Funk', 'Other']
            }), { status: 200 });
        }

        const config = JSON.parse(settings.config);
        return new Response(JSON.stringify({
            genres: config.genres || ['Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Other'],
            siteName: config.siteName || 'LOST MUSIC',
            heroText: config.heroText || 'THE NEW ORDER',
            heroSubText: config.heroSubText || 'INDEPENDENT DISTRIBUTION REDEFINED.',
            featuredReleaseId: config.featuredReleaseId || null,
            featuredReleaseLabel: config.featuredReleaseLabel || 'FEATURED RELEASE',
            featuredReleaseSubLabel: config.featuredReleaseSubLabel || 'NOW STREAMING',
            featuredReleaseStatus: config.featuredReleaseStatus || 'Featured',
            discord: config.discord || '',
            instagram: config.instagram || '',
            spotify: config.spotify || '',
            youtube: config.youtube || '',
            twitter: config.twitter || '',
            facebook: config.facebook || '',
            showStats: config.showStats ?? true,
            registrationsOpen: config.registrationsOpen ?? true,
            maintenanceMode: config.maintenanceMode ?? false,
            joinHeroTitle: config.joinHeroTitle || 'WORK WITH THE LOST. COMPANY',
            joinHeroSub: config.joinHeroSub || 'A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
