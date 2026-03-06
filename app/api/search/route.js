
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    console.log(`[SEARCH_API] Query: "${query}" | User: ${session.user.email} (${session.user.role})`);


    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;

    const results = [];

    // Search Artists
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
        view: isAdmin ? 'artists' : 'overview', // If not admin, they can't go to admin artists view
        params: { id: a.id },
        icon: 'Mic2'
    }));

    // Search Users (Stage Names)
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
        // Avoid duplicates if they already showed up as Artist
        if (!results.some(r => r.id === u.id || r.name === u.stageName)) {
            results.push({
                id: u.id,
                name: u.stageName || u.fullName || u.email,
                type: 'User',
                view: isAdmin ? 'users' : 'profile',
                params: { id: u.id },
                icon: 'User'
            });
        }
    });


    // Search Releases
    const releases = await prisma.release.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { artistName: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 5
    });
    releases.forEach(r => results.push({
        id: r.id,
        name: r.name,
        type: 'Release',
        view: isAdmin ? 'releases' : 'my-releases',
        params: { id: r.id },
        icon: 'Disc'
    }));

    // Search Demos
    const demos = await prisma.demo.findMany({
        where: {
            AND: [
                { title: { contains: query, mode: 'insensitive' } },
                isAdmin ? {} : { artistId: userId }
            ]
        },
        include: { artist: true },
        take: 5
    });
    demos.forEach(d => results.push({
        id: d.id,
        name: d.title,
        type: 'Demo',
        view: isAdmin ? 'submissions' : 'my-demos',
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
                isAdmin ? {} : { userId: userId }
            ]
        },
        take: 5
    });
    contracts.filter(c => c.title || c.primaryArtistName).forEach(c => results.push({
        id: c.id,
        name: c.title || 'Untitled Contract',
        type: 'Contract',
        view: isAdmin ? 'contracts' : 'my-contracts',
        params: { id: c.id },
        icon: 'Briefcase'
    }));

    console.log(`[SEARCH_API] Found ${results.length} items for "${query}"`);
    return NextResponse.json({ results: results.slice(0, 15) });
}

