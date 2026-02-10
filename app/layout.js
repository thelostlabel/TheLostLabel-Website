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
    default: "LOST MUSIC | Independent Record Label & Artist Portal",
    template: "%s | LOST MUSIC"
  },
  description: "Official portal for LOST MUSIC. Discover the best Brazilian Phonk, Funk, and Electronic music. Submit your demos and join the collective.",
  keywords: ["LOST MUSIC", "Phonk", "Brazilian Funk", "Funk Mandelo", "Music Label", "Artist Portal", "Demo Submission", "Independent Label", "Music Distribution"],
  verification: {
    google: "3ghNlS-ul1NRXkqu9LWBoAmsKORus0SUMahs332IHFY",
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "LOST MUSIC | Next-Gen Artist Portal",
    description: "The home of Brazilian Phonk and Funk. submit your tracks and manage your artist career.",
    url: "https://thelostlabel.com",
    siteName: "LOST MUSIC",
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
    title: "LOST MUSIC | Brazilian Phonk & Funk Label",
    description: "Submit your demos to the LOST MUSIC collective.",
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
};

export const viewport = {
  themeColor: '#000000',
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
