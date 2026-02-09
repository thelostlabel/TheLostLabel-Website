export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/admin/'],
            },
        ],
        sitemap: 'https://lostmusic.io/sitemap.xml',
    };
}
