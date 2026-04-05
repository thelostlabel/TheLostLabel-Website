export default function robots() {
    const baseUrl = (process.env.NEXTAUTH_URL || 'https://thelostlabel.com').replace(/\/+$/, '');

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard/',
                    '/auth/',
                    '/api/',
                ],
            },
        ],
        host: baseUrl,
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
