export default function sitemap() {
    const baseUrl = 'https://lostmusic.io';

    const routes = [
        '',
        '/artists',
        '/releases',
        '/join',
        '/faq',
        '/terms',
        '/privacy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
