export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
}

export function toReleaseSlug(name: string, artistName: string | null | undefined, id: string): string {
    const namePart = slugify(name || 'release');
    const artistPart = artistName ? slugify(artistName) : null;
    const humanPart = artistPart ? `${namePart}-by-${artistPart}` : namePart;
    return `${humanPart}--${id}`;
}

export function fromReleaseSlug(slug: string): string {
    const idx = slug.lastIndexOf('--');
    return idx !== -1 ? slug.slice(idx + 2) : slug;
}
