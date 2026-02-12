import "./globals.css";
import Navbar from "./components/Navbar";
import AuthProvider from "./components/AuthProvider";
import SmoothScroll from "./components/SmoothScroll";
import { ToastProvider } from "./components/ToastContext";
import { PlayerProvider } from "./components/PlayerContext";
import Player from "./components/Player";

export const metadata = {
  metadataBase: new URL('https://thelostlabel.com'), // Using new domain for absolute image paths
  title: {
    default: "The Lost Label | Premier Brazilian Phonk & Funk Record Label",
    template: "%s | The Lost Label"
  },
  description: " The Lost Label is the leading independent record label for Brazilian Phonk, Funk, and Electronic music. We provide major label infrastructure for independent artists. Join the movement.",
  keywords: ["The Lost Label", "Lost Label", "Brazilian Funk", "Phonk", "Phonk Label", "Funk Mandelo", "Music Distribution", "Independent Label", "Artist Portal", "Demo Submission"],
  verification: {
    google: "3ghNlS-ul1NRXkqu9LWBoAmsKORus0SUMahs332IHFY",
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "The Lost Label | Premier Brazilian Phonk & Funk Label",
    description: "The home of Brazilian Phonk and Funk. Submit your tracks and manage your artist career with The Lost Label.",
    url: "https://thelostlabel.com",
    siteName: "The Lost Label",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lost Label | Brazilian Phonk & Funk",
    description: "Submit your demos to The Lost Label. The premier destination for Phonk and Funk artists.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://thelostlabel.com',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <SmoothScroll />
        <AuthProvider>
          <ToastProvider>
            <PlayerProvider>
              <Navbar />
              <main>{children}</main>
              <Player />
            </PlayerProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
