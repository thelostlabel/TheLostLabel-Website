import prisma from "@/lib/prisma";

const BASE_URL = "https://thelostlabel.com";

export default async function sitemap() {
    const now = new Date();

    const staticRoutes = [
        { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE_URL}/artists`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/releases`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/join`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 }
    ];

    try {
        const [artists, releases] = await Promise.all([
            prisma.artist.findMany({
                where: { status: "active" },
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 500
            }),
            prisma.release.findMany({
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 1000
            })
        ]);

        const artistRoutes = artists.map((artist) => ({
            url: `${BASE_URL}/artists/${artist.id}`,
            lastModified: artist.updatedAt || now,
            changeFrequency: "weekly",
            priority: 0.75
        }));

        const releaseRoutes = releases.map((release) => ({
            url: `${BASE_URL}/releases/${release.id}`,
            lastModified: release.updatedAt || now,
            changeFrequency: "weekly",
            priority: 0.75
        }));

        return [...staticRoutes, ...artistRoutes, ...releaseRoutes];
    } catch (error) {
        console.error("[sitemap] dynamic generation failed:", error);
        return staticRoutes;
    }
}
