import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { fromReleaseSlug, toReleaseSlug } from "@/lib/release-slug";
import { BRANDING } from "@/lib/branding";
import ReleaseDetailClient from "./ReleaseDetailClient";

export const revalidate = 3600;

const BASE_URL = (process.env.NEXTAUTH_URL || "https://thelostlabel.com").replace(/\/+$/, "");
const LABEL_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || BRANDING.fullName;

async function getRelease(rawSlug) {
    const id = fromReleaseSlug(rawSlug);
    return prisma.release.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            artistName: true,
            image: true,
            releaseDate: true,
            spotifyUrl: true,
            type: true,
            totalTracks: true,
            previewUrl: true,
            streamCountText: true,
            releaseArtists: { select: { artistId: true, name: true } },
        },
    }).catch(() => null);
}

function getArtistNames(release) {
    if (release.releaseArtists?.length) {
        return release.releaseArtists.map((a) => a.name).join(", ");
    }
    return release.artistName || "Unknown Artist";
}

function getReleaseYear(release) {
    if (!release.releaseDate) return null;
    const match = release.releaseDate.match(/\d{4}/);
    return match ? match[0] : null;
}

function getReleaseTypeLabel(type) {
    switch (type?.toLowerCase()) {
        case "single": return "Single";
        case "ep": return "EP";
        case "album": return "Album";
        case "compilation": return "Compilation";
        default: return "Release";
    }
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
        return dateStr;
    }
}

export async function generateMetadata({ params }) {
    const { id: rawSlug } = await params;
    const release = await getRelease(rawSlug);

    if (!release) {
        return { title: `Release Not Found | ${LABEL_NAME}` };
    }

    const artistNames = getArtistNames(release);
    const year = getReleaseYear(release);
    const typeLabel = getReleaseTypeLabel(release.type);
    const slug = toReleaseSlug(release.name, release.artistName, release.id);
    const url = `${BASE_URL}/releases/${slug}`;
    const image = release.image || "/logo.png";

    const title = `${release.name} - ${artistNames}`;
    const yearStr = year ? ` (${year})` : "";
    const description = `${release.name} by ${artistNames}${yearStr} — ${typeLabel}. Stream on Spotify and all major platforms. Released by ${LABEL_NAME}.`;

    const keywords = [
        release.name,
        artistNames,
        `${release.name} ${artistNames}`,
        `${release.name} lyrics`,
        `${release.name} ${artistNames} lyrics`,
        `${artistNames} new ${typeLabel.toLowerCase()}`,
        typeLabel !== "Release" ? `${artistNames} ${typeLabel.toLowerCase()}` : null,
        year ? `${artistNames} ${year}` : null,
        LABEL_NAME,
        "music",
        "stream",
        "spotify",
    ].filter(Boolean);

    return {
        title,
        description,
        keywords,
        openGraph: {
            title: `${title} | ${LABEL_NAME}`,
            description,
            url,
            type: "music.song",
            images: [{ url: image, width: 640, height: 640, alt: `${release.name} cover art` }],
            siteName: LABEL_NAME,
            ...(release.releaseDate && { "music:release_date": release.releaseDate }),
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | ${LABEL_NAME}`,
            description,
            images: [image],
        },
        alternates: { canonical: url },
    };
}

export default async function ReleaseDetailPage({ params }) {
    const { id: rawSlug } = await params;
    const id = fromReleaseSlug(rawSlug);
    const release = await getRelease(rawSlug);

    // 301 redirect: UUID-only → full slug URL
    if (release && !rawSlug.includes("--")) {
        const slug = toReleaseSlug(release.name, release.artistName, release.id);
        redirect(`/releases/${slug}`);
    }

    if (!release) {
        return <ReleaseDetailClient />;
    }

    const artistNames = getArtistNames(release);
    const year = getReleaseYear(release);
    const typeLabel = getReleaseTypeLabel(release.type);
    const slug = toReleaseSlug(release.name, release.artistName, release.id);
    const url = `${BASE_URL}/releases/${slug}`;
    const releaseDateFormatted = formatDate(release.releaseDate);
    const image = release.image || null;

    const isAlbumOrEP = ["album", "ep", "compilation"].includes(release.type?.toLowerCase());

    // Build initial data for client hydration
    const initialRelease = {
        id: release.id,
        name: release.name,
        image: release.image,
        spotify_url: release.spotifyUrl,
        release_date: release.releaseDate,
        type: release.type,
        total_tracks: release.totalTracks,
        streamCountText: release.streamCountText,
        artists: release.releaseArtists?.map((a) => ({ id: a.artistId, name: a.name })) || [],
        tracks: [{
            id: release.id,
            name: release.name,
            artists: release.releaseArtists?.map((a) => ({ id: a.artistId, name: a.name })) || [],
            duration_ms: 0,
            preview_url: release.previewUrl,
        }],
    };

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": isAlbumOrEP ? "MusicAlbum" : "MusicRecording",
        name: release.name,
        url,
        image: release.image || undefined,
        datePublished: release.releaseDate || undefined,
        ...(isAlbumOrEP
            ? {
                albumReleaseType: release.type?.toLowerCase() === "ep" ? "ep" : release.type?.toLowerCase() === "compilation" ? "compilation" : "album",
                numTracks: release.totalTracks,
                byArtist: { "@type": "MusicGroup", name: artistNames },
            }
            : {
                byArtist: { "@type": "MusicGroup", name: artistNames },
                ...(release.previewUrl && { audio: { "@type": "AudioObject", contentUrl: release.previewUrl } }),
                recordingOf: {
                    "@type": "MusicComposition",
                    name: release.name,
                    composer: { "@type": "MusicGroup", name: artistNames },
                },
            }
        ),
        publisher: {
            "@type": "Organization",
            name: LABEL_NAME,
            url: BASE_URL,
        },
        ...(release.spotifyUrl && { sameAs: [release.spotifyUrl] }),
        ...(year && { copyrightYear: parseInt(year) }),
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Releases", item: `${BASE_URL}/releases` },
            { "@type": "ListItem", position: 3, name: `${release.name} - ${artistNames}`, item: url },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
            />

            {/* SSR content for search engines — hidden visually, visible to crawlers */}
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
                <h1>{release.name} - {artistNames}</h1>
                <p>
                    {release.name} by {artistNames} — {typeLabel}
                    {year ? `, ${year}` : ""}.
                    {releaseDateFormatted ? ` Released ${releaseDateFormatted}.` : ""}
                    {release.totalTracks > 1 ? ` ${release.totalTracks} tracks.` : ""}
                    {` Stream on Spotify and all major platforms. Released by ${LABEL_NAME}.`}
                </p>
                {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={`${release.name} by ${artistNames} cover art`} width={640} height={640} />
                )}
                {release.spotifyUrl && (
                    <a href={release.spotifyUrl} rel="noopener noreferrer">
                        Listen to {release.name} on Spotify
                    </a>
                )}
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><a href={BASE_URL}>Home</a></li>
                        <li><a href={`${BASE_URL}/releases`}>Releases</a></li>
                        <li>{release.name} - {artistNames}</li>
                    </ol>
                </nav>
            </article>

            <ReleaseDetailClient initialRelease={initialRelease} />
        </>
    );
}
