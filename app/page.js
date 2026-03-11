import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";
import { BRANDING } from "@/lib/branding";
import { TENANT } from "@/lib/tenant";
import { getSiteContentByKey } from "@/lib/site-content";
import { parseFooterLinks, parseHomePartners, parseHomeServices, parseHomeStats } from "@/lib/site-content-data";


export const metadata = {
    title: `${BRANDING.fullName} | Music Label`,
    description: `Welcome to ${BRANDING.fullName}. Submit your demos, distribute your music, and grow your career with us.`,
    alternates: {
        canonical: process.env.NEXTAUTH_URL || '/',
    }
};


export default async function HomePage() {
    if (!TENANT.features.homePage) {
        redirect('/dashboard');
    }

    const [servicesContent, statsContent, partnersContent, footerLinksContent] = await Promise.all([
        getSiteContentByKey('home_services'),
        getSiteContentByKey('home_stats'),
        getSiteContentByKey('home_partners'),
        getSiteContentByKey('footer_links')
    ]);

    return (
        <HomeClient
            initialContent={{
                services: parseHomeServices(servicesContent.content),
                stats: parseHomeStats(statsContent.content),
                partners: parseHomePartners(partnersContent.content),
                footerLinks: parseFooterLinks(footerLinksContent.content)
            }}
        />
    );
}
