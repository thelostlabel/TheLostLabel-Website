
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function extractSpotifyArtistId(url) {
    if (!url || typeof url !== 'string') return null;
    const parts = url.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.split('?')[0]?.trim() || null;
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get('q') || '').trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const isStaff = session.user.role === 'admin' || session.user.role === 'a&r';
    const userId = session.user.id;
    const userEmail = String(session.user.email || '').toLowerCase();

    const results = [];

    let spotifyId = null;
    if (!isStaff) {
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                spotifyUrl: true,
                artist: {
                    select: {
                        spotifyUrl: true
                    }
                }
            }
        });
        spotifyId = extractSpotifyArtistId(currentUser?.artist?.spotifyUrl || currentUser?.spotifyUrl);
    }

    if (isStaff) {
        const artists = await prisma.artist.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5
        });
        artists.filter(a => a.name).forEach(a => results.push({
            id: a.id,
            name: a.name,
            type: 'Artist',
            view: 'artists',
            params: { id: a.id },
            icon: 'Mic2'
        }));

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { stageName: { contains: query, mode: 'insensitive' } },
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5
        });
        users.forEach(u => {
            if (!results.some(r => r.id === u.id || r.name === u.stageName)) {
                results.push({
                    id: u.id,
                    name: u.stageName || u.fullName || u.email,
                    type: 'User',
                    view: 'users',
                    params: { id: u.id },
                    icon: 'User'
                });
            }
        });
    }

    // Search Releases
    const releases = await prisma.release.findMany({
        where: isStaff ? {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { artistName: { contains: query, mode: 'insensitive' } }
            ]
        } : {
            AND: [
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { artistName: { contains: query, mode: 'insensitive' } }
                    ]
                },
                {
                    OR: [
                        {
                            contracts: {
                                some: {
                                    OR: [
                                        { userId },
                                        { artist: { userId } },
                                        ...(userEmail ? [{ primaryArtistEmail: userEmail }] : []),
                                        ...(userEmail ? [{ artist: { email: userEmail } }] : []),
                                        { splits: { some: { userId } } },
                                        ...(userEmail ? [{ splits: { some: { email: userEmail } } }] : []),
                                        ...(userEmail ? [{ splits: { some: { user: { email: userEmail } } } }] : [])
                                    ]
                                }
                            }
                        },
                        ...(spotifyId ? [{ artistsJson: { contains: spotifyId } }] : [])
                    ]
                }
            ]
        },
        take: 5
    });
    releases.forEach(r => results.push({
        id: r.id,
        name: r.name,
        type: 'Release',
        view: isStaff ? 'releases' : 'my-releases',
        params: { id: r.id },
        icon: 'Disc'
    }));

    // Search Demos
    const demos = await prisma.demo.findMany({
        where: {
            AND: [
                { title: { contains: query, mode: 'insensitive' } },
                isStaff ? {} : { artistId: userId }
            ]
        },
        include: { artist: true },
        take: 5
    });
    demos.forEach(d => results.push({
        id: d.id,
        name: d.title,
        type: 'Demo',
        view: isStaff ? 'submissions' : 'my-demos',
        params: { id: d.id },
        icon: 'Music'
    }));

    // Search Contracts
    const contracts = await prisma.contract.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { primaryArtistName: { contains: query, mode: 'insensitive' } }
                    ]
                },
                isStaff ? {} : {
                    OR: [
                        { userId },
                        { artist: { userId } },
                        ...(userEmail ? [{ primaryArtistEmail: userEmail }] : []),
                        ...(userEmail ? [{ artist: { email: userEmail } }] : []),
                        { splits: { some: { userId } } },
                        ...(userEmail ? [{ splits: { some: { email: userEmail } } }] : []),
                        ...(userEmail ? [{ splits: { some: { user: { email: userEmail } } } }] : [])
                    ]
                }
            ]
        },
        take: 5
    });
    contracts.filter(c => c.title || c.primaryArtistName).forEach(c => results.push({
        id: c.id,
        name: c.title || 'Untitled Contract',
        type: 'Contract',
        view: isStaff ? 'contracts' : 'my-contracts',
        params: { id: c.id },
        icon: 'Briefcase'
    }));

    return NextResponse.json({ results: results.slice(0, 15) });
}
