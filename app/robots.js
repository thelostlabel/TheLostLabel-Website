export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard/',
                    '/auth/',
                    '/api/',
                    '/api/admin/',
                    '/api/auth/',
                    '/api/cron/',
                    '/api/webhook/'
                ],
            },
        ],
        host: 'https://thelostlabel.com',
        sitemap: 'https://thelostlabel.com/sitemap.xml',
    };
}
