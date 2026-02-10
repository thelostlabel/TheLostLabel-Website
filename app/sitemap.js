export default function sitemap() {
    const baseUrl = 'https://87-248-157-4.sslip.io';

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
