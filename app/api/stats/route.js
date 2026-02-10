import prisma from "@/lib/prisma";

// GET: Fetch total artist count
export async function GET() {
    try {
        const [artistCount, albumCountData, songCountData] = await Promise.all([
            prisma.artist.count(),
            prisma.release.count({ where: { type: 'album' } }),
            prisma.release.aggregate({
                _sum: {
                    totalTracks: true
                }
            })
        ]);

        return new Response(JSON.stringify({
            artistCount,
            albumCount: albumCountData,
            songCount: songCountData._sum.totalTracks || 0
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });
    } catch (error) {
        console.error("Stats Error:", error);
        return new Response(JSON.stringify({ artistCount: 0, albumCount: 0, songCount: 0 }), { status: 200 });
    }
}
