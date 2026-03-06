import HomeClient from "./HomeClient";
import { BRANDING } from "@/lib/branding";


export const metadata = {
    title: `${BRANDING.fullName} | #1 Brazilian Phonk & Funk Record Label`,
    description: `Welcome to ${BRANDING.fullName}. The global home for Brazilian Phonk, Funk, and Electronic music. Submit your demos, distribute your music, and grow your career with us.`,
    alternates: {
        canonical: 'https://thelostlabel.com',
    }
};


export default function HomePage() {
    return <HomeClient />;
}
