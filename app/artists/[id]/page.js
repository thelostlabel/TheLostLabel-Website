import Link from 'next/link';
import ArtistDetailClient from './ArtistDetailClient';
import { getArtistsDetails, getArtistAlbums } from '@/lib/spotify'; // Direct library calls for efficiency
import prisma from "@/lib/prisma";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const artistDetails = await getArtistsDetails([id]);
    const artist = artistDetails?.[0];

    return {
        title: artist ? `${artist.name} | LOST. Roster` : 'Artist Not Found | LOST.',
        description: artist ? `Explore ${artist.name}'s profile and releases on LOST.` : 'The requested artist could not be found.',
    };
}

export default async function ArtistDetailPage({ params }) {
    const { id: artistId } = await params;

    // Fetch data in parallel on the server
    const [artistDetails, dbReleases, dbArtist] = await Promise.all([
        getArtistsDetails([artistId]),
        prisma.release.findMany({
            where: {
                artistsJson: { contains: artistId }
            }
        }),
        prisma.artist.findUnique({
            where: { id: artistId }
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
                    artists: JSON.parse(r.artistsJson || '[]'),
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

    // Pass data to Client Component for interactivity
    return <ArtistDetailClient artist={artist} releases={releases} />;
}
