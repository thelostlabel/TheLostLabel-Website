import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";
import { BRANDING } from "@/lib/branding";
import { TENANT } from "@/lib/tenant";


export const metadata = {
    title: `${BRANDING.fullName} | Music Label`,
    description: `Welcome to ${BRANDING.fullName}. Submit your demos, distribute your music, and grow your career with us.`,
    alternates: {
        canonical: process.env.NEXTAUTH_URL || '/',
    }
};


export default function HomePage() {
    if (!TENANT.features.homePage) {
        redirect('/dashboard');
    }
    return <HomeClient />;
}
