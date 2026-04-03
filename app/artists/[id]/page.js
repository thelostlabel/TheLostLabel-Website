import Link from 'next/link';
import ArtistDetailClient from './ArtistDetailClient';
import { getArtistsDetails } from '@/lib/spotify'; // Direct library calls for efficiency
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById, mapReleaseArtistsToSummary } from "@/lib/release-artists";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const dbArtist = await prisma.artist.findUnique({
        where: { id },
        select: { id: true, name: true, spotifyUrl: true }
    });
    const spotifyId = dbArtist?.spotifyUrl?.split('/').filter(Boolean).pop()?.split('?')[0] || id;
    const artistDetails = await getArtistsDetails([spotifyId]);
    const artist = artistDetails?.[0] || dbArtist;

    const name = artist?.name || dbArtist?.name;
    const image = artist?.images?.[0]?.url || null;
    const url = `https://thelostlabel.com/artists/${id}`;
    const description = name
        ? `${name} is signed to The Lost Label. Stream their releases, explore their profile and discography on LOST.`
        : 'The requested artist could not be found.';

    return {
        title: name ? `${name} | LOST. Roster` : 'Artist Not Found | LOST.',
        description,
        keywords: name ? [name, `${name} Lost Label`, `${name} music`, 'The Lost Label', 'Lost Label', 'LOST. roster'] : [],
        openGraph: {
            title: name ? `${name} | LOST. Roster` : 'Artist Not Found',
            description,
            url,
            type: 'profile',
            images: image ? [{ url: image, width: 640, height: 640, alt: name }] : [{ url: '/logo.png' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: name ? `${name} | LOST. Roster` : 'Artist Not Found',
            description,
            images: [image || '/logo.png'],
        },
        alternates: { canonical: url },
    };
}

export default async function ArtistDetailPage({ params }) {
    const { id: artistId } = await params;
    const dbArtist = await prisma.artist.findUnique({
        where: { id: artistId }
    });
    const spotifyArtistId = dbArtist?.spotifyUrl?.split('/').filter(Boolean).pop()?.split('?')[0] || artistId;

    // Fetch data in parallel on the server
    const [artistDetails, dbReleases] = await Promise.all([
        getArtistsDetails([spotifyArtistId]),
        prisma.release.findMany({
            where: {
                OR: [
                    getReleaseArtistWhereById(artistId),
                    getReleaseArtistWhereById(spotifyArtistId)
                ].filter(Boolean)
            },
            include: {
                releaseArtists: {
                    select: { artistId: true, name: true }
                }
            }
        })
    ]);

    const artist = artistDetails?.[0];

    // Merge DB listeners into the artist object
    if (artist && dbArtist) {
        artist.monthlyListeners = dbArtist.monthlyListeners || 0;
        artist.dbInfo = dbArtist; // Keep reference to other DB info
    }

    if (!artist) {
        return (
            <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: '900', letterSpacing: '-0.04em' }}>ARTIST_NOT_FOUND</h1>
                <Link href="/artists" style={{ color: 'rgba(229,231,235,0.9)', fontSize: '11px', marginTop: '30px', fontWeight: '900', letterSpacing: '2px', textDecoration: 'none' }}>
                    ← RETURN_TO_ROSTER
                </Link>
            </div>
        );
    }

    // Map DB releases to the rendering format and group by base name
    const groupedReleases = {};
    if (dbReleases && Array.isArray(dbReleases)) {
        dbReleases.forEach(r => {
            const baseName = r.name.split('(')[0].split('-')[0].trim().toLowerCase();

            if (!groupedReleases[baseName]) {
                groupedReleases[baseName] = {
                    id: r.id,
                    name: r.name,
                    image: r.image,
                    spotify_url: r.spotifyUrl,
                    release_date: r.releaseDate,
                    artists: mapReleaseArtistsToSummary(r.releaseArtists),
                    type: r.type || 'album',
                    is_manual: true,
                    versionCount: 0
                };
            }
            groupedReleases[baseName].versionCount++;

            if (!r.name.includes('(') && !r.name.includes('-')) {
                Object.assign(groupedReleases[baseName], {
                    id: r.id,
                    name: r.name,
                    image: r.image,
                    spotify_url: r.spotifyUrl,
                    release_date: r.releaseDate
                });
            }
        });
    }

    const releases = Object.values(groupedReleases);

    // Sort by date
    releases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'MusicGroup',
        name: artist.name,
        image: artist.images?.[0]?.url || undefined,
        url: `https://thelostlabel.com/artists/${artistId}`,
        sameAs: [
            dbArtist?.spotifyUrl,
            dbArtist?.instagramUrl,
        ].filter(Boolean),
        memberOf: {
            '@type': 'Organization',
            name: 'The Lost Label',
            url: 'https://thelostlabel.com',
        },
        track: releases.slice(0, 10).map((r) => ({
            '@type': 'MusicRecording',
            name: r.name,
            url: `https://thelostlabel.com/releases/${r.id}`,
            sameAs: r.spotify_url || undefined,
        })),
    };

    // Pass data to Client Component for interactivity
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ArtistDetailClient artist={artist} releases={releases} />
        </>
    );
}
