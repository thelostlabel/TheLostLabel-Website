import HomeClient from "./HomeClient";

export const metadata = {
    title: "The Lost Label | #1 Brazilian Phonk & Funk Record Label",
    description: "Welcome to The Lost Label. The global home for Brazilian Phonk, Funk, and Electronic music. Submit your demos, distribute your music, and grow your career with us.",
    alternates: {
        canonical: 'https://thelostlabel.com',
    }
};

export default function HomePage() {
    return <HomeClient />;
}
