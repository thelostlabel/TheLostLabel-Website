import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";
import { BRANDING } from "@/lib/branding";
import { TENANT } from "@/lib/tenant";
import { getPublicSettings } from "@/lib/public-settings";
import { getSiteContentByKey } from "@/lib/site-content";
import { parseFooterLinks, parseHomePartners, parseHomeServices, parseHomeStats } from "@/lib/site-content-data";

export async function generateMetadata() {
    const publicSettings = await getPublicSettings();
    const siteName = publicSettings.siteName || BRANDING.fullName;
    return {
        title: `${siteName} | Music Label`,
        description: publicSettings.heroSubText || `Welcome to ${siteName}. Submit your demos, distribute your music, and grow your career with us.`,
        alternates: {
            canonical: process.env.NEXTAUTH_URL || '/',
        }
    };
}


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
