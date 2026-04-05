import { getBaseUrl } from "@/lib/site-url";

export default function robots() {
    const baseUrl = getBaseUrl();

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
