import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'a&r'].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const [
            totalUsers,
            totalArtists,
            pendingDemos,
            totalDemos,
            pendingRequests,
            albumCount,
            songCountData,
            recentDemos,
            recentRequests
        ] = await Promise.all([
            prisma.user.count(),
            prisma.artist.count(),
            prisma.demo.count({ where: { status: 'pending' } }),
            prisma.demo.count(),
            prisma.changeRequest.count({ where: { status: 'pending' } }),
            prisma.release.count({ where: { type: 'album' } }),
            prisma.release.aggregate({ _sum: { totalTracks: true } }),
            prisma.demo.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { artist: { select: { stageName: true, email: true } } }
            }),
            prisma.changeRequest.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { stageName: true, email: true } } }
            })
        ]);

        return new Response(JSON.stringify({
            counts: {
                users: totalUsers,
                artists: totalArtists,
                pendingDemos,
                totalDemos,
                pendingRequests,
                albums: albumCount,
                songs: songCountData._sum.totalTracks || 0
            },
            recent: {
                demos: recentDemos,
                requests: recentRequests
            }
        }), { status: 200 });

    } catch (e) {
        console.error("Admin Stats Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
