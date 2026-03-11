import "./globals.css";
import Navbar from "./components/Navbar";
import AuthProvider from "./components/AuthProvider";
import { PublicSettingsProvider } from "./components/PublicSettingsContext";
import SmoothScroll from "./components/SmoothScroll";
import { ToastProvider } from "./components/ToastContext";
import { PlayerProvider } from "./components/PlayerContext";
import Player from "./components/Player";
import { getPublicSettings } from "@/lib/public-settings";
import { BRANDING } from "@/lib/branding";

export async function generateMetadata() {
  const publicSettings = await getPublicSettings();
  const siteName = publicSettings.siteName || BRANDING.fullName;
  const description = publicSettings.heroSubText || `Welcome to ${siteName}. Submit your demos, distribute your music, and grow your career with us.`;
  const metadataBase = new URL(process.env.NEXTAUTH_URL || 'https://thelostlabel.com');

  return {
    metadataBase,
    title: {
      default: `${siteName} | Artist Portal`,
      template: `%s | ${siteName}`
    },
    description,
    keywords: [siteName, BRANDING.fullName, "Music Distribution", "Independent Label", "Artist Portal", "Demo Submission"],
    category: "music",
    verification: {
      google: "3ghNlS-ul1NRXkqu9LWBoAmsKORus0SUMahs332IHFY",
    },
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
    openGraph: {
      title: `${siteName} | Artist Portal`,
      description,
      url: metadataBase.toString(),
      siteName,
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
      title: `${siteName} | Artist Portal`,
      description,
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
      canonical: '/',
    },
  };
}

export const viewport = {
  themeColor: '#000000',
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const publicSettings = await getPublicSettings();

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <PublicSettingsProvider value={publicSettings}>
          <SmoothScroll />
          <AuthProvider>
            <ToastProvider>
              <PlayerProvider>
                <Navbar />
                <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
                <Player />
              </PlayerProvider>
            </ToastProvider>
          </AuthProvider>
        </PublicSettingsProvider>
      </body>
    </html>
  );
}
