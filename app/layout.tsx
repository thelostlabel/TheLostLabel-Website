import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Bebas_Neue } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "block",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
  display: "block",
});
import AuthProvider from "./components/AuthProvider";
import QueryProvider from "./components/QueryProvider";
import { PublicSettingsProvider } from "./components/PublicSettingsContext";
import { ToastProvider } from "./components/ToastContext";
import { PlayerProvider } from "./components/PlayerContext";
import Player from "./components/Player";
import SmoothScroll from "./components/SmoothScroll";
import { ThemeProvider } from "./components/ThemeProvider";
import { getPublicSettings } from "@/lib/public-settings";
import { BRANDING } from "@/lib/branding";
import { getBaseUrl } from "@/lib/site-url";
import { TENANT } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const publicSettings = await getPublicSettings();
  const siteName = publicSettings.siteName || BRANDING.fullName;
  const description = publicSettings.heroSubText || `Welcome to ${siteName}. Submit your demos, distribute your music, and grow your career with us.`;
  const metadataBase = new URL(getBaseUrl());

  return {
    metadataBase,
    title: {
      default: `${siteName} | Artist Portal`,
      template: `%s | ${siteName}`
    },
    description,
    keywords: [
      BRANDING.fullName, BRANDING.shortName, BRANDING.dotName,
      "phonk label", "phonk music", "independent music label",
      "music distribution", "artist portal", "demo submission",
      "submit demo", "sign to label", "underground music",
      siteName, BRANDING.fullName,
    ],
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

export const viewport: Viewport = {
  themeColor: '#000000',
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const publicSettings = await getPublicSettings();

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" data-tenant={TENANT.id}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);document.documentElement.className=t;})();`,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${bebasNeue.variable} bg-background text-foreground`} style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
        <PublicSettingsProvider value={publicSettings}>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <PlayerProvider>
                  <ThemeProvider>
                    <SmoothScroll />
                    <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
                    <Player />
                  </ThemeProvider>
                </PlayerProvider>
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </PublicSettingsProvider>
      </body>
    </html>
  );
}
