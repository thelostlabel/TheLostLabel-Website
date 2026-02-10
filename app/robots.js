export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/admin/'],
            },
        ],
        sitemap: 'https://87-248-157-4.sslip.io/sitemap.xml',
    };
}
