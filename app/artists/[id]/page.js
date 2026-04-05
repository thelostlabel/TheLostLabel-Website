import Link from 'next/link';
import ArtistDetailClient from './ArtistDetailClient';
import { getArtistsDetails } from '@/lib/spotify';
import prisma from "@/lib/prisma";
import { getReleaseArtistWhereById, mapReleaseArtistsToSummary } from "@/lib/release-artists";
import { BRANDING } from "@/lib/branding";
import { toReleaseSlug } from "@/lib/release-slug";

export const revalidate = 3600;

const BASE_URL = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/\/+$/, "");
const LABEL_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || BRANDING.fullName;

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
    const url = `${BASE_URL}/artists/${id}`;
    const description = name
        ? `${name} is signed to ${LABEL_NAME}. Stream their releases, explore their profile and discography.`
        : 'The requested artist could not be found.';

    const title = name ? `${name} | ${LABEL_NAME}` : `Artist Not Found | ${LABEL_NAME}`;

    return {
        title,
        description,
        keywords: name ? [name, `${name} music`, `${name} discography`, `${name} releases`, `${name} spotify`, LABEL_NAME] : [],
        openGraph: {
            title,
            description,
            url,
            type: 'profile',
            siteName: LABEL_NAME,
            images: image ? [{ url: image, width: 640, height: 640, alt: name }] : [{ url: '/logo.png' }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
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
        url: `${BASE_URL}/artists/${artistId}`,
        sameAs: [
            dbArtist?.spotifyUrl,
            dbArtist?.instagramUrl,
        ].filter(Boolean),
        memberOf: {
            '@type': 'Organization',
            name: LABEL_NAME,
            url: BASE_URL,
        },
        track: releases.slice(0, 10).map((r) => ({
            '@type': 'MusicRecording',
            name: r.name,
            url: `${BASE_URL}/releases/${toReleaseSlug(r.name, artist.name, r.id)}`,
            sameAs: r.spotify_url || undefined,
        })),
    };

    const artistImage = artist.images?.[0]?.url || null;
    const artistUrl = `${BASE_URL}/artists/${artistId}`;

    // BreadcrumbList
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Artists', item: `${BASE_URL}/artists` },
            { '@type': 'ListItem', position: 3, name: artist.name, item: artistUrl },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
            />

            {/* SSR content for search engines */}
            <article
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    borderWidth: 0,
                }}
            >
                <h1>{artist.name}</h1>
                <p>
                    {artist.name} is signed to {LABEL_NAME}.
                    {releases.length > 0 ? ` ${releases.length} releases including ${releases.slice(0, 3).map(r => r.name).join(", ")}.` : ""}
                    {dbArtist?.monthlyListeners ? ` ${dbArtist.monthlyListeners.toLocaleString()} monthly listeners on Spotify.` : ""}
                    {` Stream their music on all major platforms.`}
                </p>
                {artistImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artistImage} alt={artist.name} width={640} height={640} />
                )}
                {releases.length > 0 && (
                    <section>
                        <h2>Discography</h2>
                        <ul>
                            {releases.map((r) => (
                                <li key={r.id}>
                                    <a href={`${BASE_URL}/releases/${toReleaseSlug(r.name, artist.name, r.id)}`}>
                                        {r.name}
                                    </a>
                                    {r.release_date ? ` (${new Date(r.release_date).getFullYear()})` : ""}
                                    {r.type ? ` — ${r.type}` : ""}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {dbArtist?.spotifyUrl && (
                    <a href={dbArtist.spotifyUrl} rel="noopener noreferrer">
                        Listen to {artist.name} on Spotify
                    </a>
                )}
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><a href={BASE_URL}>Home</a></li>
                        <li><a href={`${BASE_URL}/artists`}>Artists</a></li>
                        <li>{artist.name}</li>
                    </ol>
                </nav>
            </article>

            <ArtistDetailClient artist={artist} releases={releases} />
        </>
    );
}
