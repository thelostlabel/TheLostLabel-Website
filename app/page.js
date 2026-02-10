import HomeClient from "./HomeClient";

export const metadata = {
    title: "LOST MUSIC | Independent Record Label & Artist Management",
    description: "The next-gen music label for Brazilian Phonk, Funk, and Electronic music. We provide major label infrastructure for independent artists.",
    alternates: {
        canonical: 'https://87-248-157-4.sslip.io',
    }
};

export default function HomePage() {
    return <HomeClient />;
}
