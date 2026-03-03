import "./globals.css";
import Navbar from "./components/Navbar";
import AuthProvider from "./components/AuthProvider";
import SmoothScroll from "./components/SmoothScroll";
import { ToastProvider } from "./components/ToastContext";
import { PlayerProvider } from "./components/PlayerContext";
import Player from "./components/Player";
import prisma from "@/lib/prisma";
import { BRAND, BRAND_THEME_VARS } from "@/lib/brand";
import BrandHydrator from "./components/BrandHydrator";

async function getSystemConfig() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });
    if (settings && settings.config) {
      return JSON.parse(settings.config);
    }
  } catch (e) {
    console.warn("Could not fetch system settings from database");
  }
  return null;
}

export const metadata = {
  metadataBase: new URL('https://thelostlabel.com'), // Using new domain for absolute image paths
  title: {
    default: "The Lost Label | Premier Brazilian Phonk & Funk Record Label",
    template: "%s | The Lost Label"
  },
  description: "The Lost Label is the leading independent record label for Brazilian Phonk, Funk, and Electronic music. We provide major label infrastructure for independent artists. Join the movement.",
  keywords: ["The Lost Label", "Lost Label", "Brazilian Funk", "Phonk", "Phonk Label", "Funk Mandelo", "Music Distribution", "Independent Label", "Artist Portal", "Demo Submission"],
  category: "music",
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
    canonical: '/',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: "device-width",
  initialScale: 1,
};


export default async function RootLayout({ children }) {
  const dbConfig = await getSystemConfig();

  const themeVars = { ...BRAND_THEME_VARS };
  if (dbConfig?.theme) {
    const theme = dbConfig.theme;
    if (theme.primaryColor) {
      themeVars["--primary"] = theme.primaryColor;
      themeVars["--primary-dim"] = theme.primaryColor + "22";
      themeVars["--primary-faint"] = theme.primaryColor + "12";
      themeVars["--primary-glow"] = theme.primaryColor + "55";
    }
    if (theme.bgColor) themeVars["--bg"] = theme.bgColor;
    if (theme.accentColor) themeVars["--accent"] = theme.accentColor;
    if (theme.surfaceColor) themeVars["--bg-surface"] = theme.surfaceColor;
    if (theme.borderColor) themeVars["--border"] = theme.borderColor;
  }

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body style={themeVars}>
        <BrandHydrator dbConfig={dbConfig} />
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
