import prisma from "@/lib/prisma";
import ReleaseDetailClient from "./ReleaseDetailClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;

    const release = await prisma.release.findUnique({
        where: { id },
        select: {
            name: true,
            artistName: true,
            image: true,
            releaseDate: true,
            spotifyUrl: true,
            releaseArtists: { select: { name: true } },
        },
    }).catch(() => null);

    if (!release) {
        return { title: 'Release Not Found | LOST.' };
    }

    const artistNames = release.releaseArtists?.length
        ? release.releaseArtists.map((a) => a.name).join(', ')
        : release.artistName || 'Unknown Artist';

    const title = `${release.name} - ${artistNames} | LOST.`;
    const description = `Listen to "${release.name}" by ${artistNames} on The Lost Label. Stream on Spotify and all major platforms.`;
    const image = release.image || '/logo.png';
    const url = `https://thelostlabel.com/releases/${id}`;

    return {
        title,
        description,
        keywords: [
            release.name,
            artistNames,
            `${release.name} ${artistNames}`,
            `${artistNames} Lost Label`,
            'The Lost Label',
            'Lost Label',
            'phonk',
            'music release',
        ],
        openGraph: {
            title,
            description,
            url,
            type: 'music.song',
            images: [{ url: image, width: 640, height: 640, alt: release.name }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        alternates: { canonical: url },
    };
}

export default async function ReleaseDetailPage({ params }) {
    const { id } = await params;

    const release = await prisma.release.findUnique({
        where: { id },
        select: {
            name: true,
            artistName: true,
            image: true,
            releaseDate: true,
            spotifyUrl: true,
            releaseArtists: { select: { name: true } },
        },
    }).catch(() => null);

    const artistNames = release?.releaseArtists?.length
        ? release.releaseArtists.map((a) => a.name).join(', ')
        : release?.artistName || null;

    const jsonLd = release ? {
        '@context': 'https://schema.org',
        '@type': 'MusicRecording',
        name: release.name,
        byArtist: artistNames ? { '@type': 'MusicGroup', name: artistNames } : undefined,
        image: release.image || undefined,
        datePublished: release.releaseDate || undefined,
        url: `https://thelostlabel.com/releases/${id}`,
        sameAs: release.spotifyUrl || undefined,
        recordingOf: {
            '@type': 'MusicComposition',
            name: release.name,
        },
        publisher: {
            '@type': 'Organization',
            name: 'The Lost Label',
            url: 'https://thelostlabel.com',
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ReleaseDetailClient />
        </>
    );
}
