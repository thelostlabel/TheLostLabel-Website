import "./globals.css";
import Navbar from "./components/Navbar";
import AuthProvider from "./components/AuthProvider";
import SmoothScroll from "./components/SmoothScroll";
import { ToastProvider } from "./components/ToastContext";

export const metadata = {
  title: "LOST MUSIC | Independent Label & Artist Management",
  description: "Join LOST MUSIC collective. Submit demos, manage releases, and track royalties on the next-gen artist portal.",
  keywords: ["music label", "demo submission", "artist portal", "phonk", "brazilian funk", "music distribution"],
  authors: [{ name: "LOST MUSIC" }],
  openGraph: {
    title: "LOST MUSIC | Next-Gen Artist Portal",
    description: "Submit demos and manage your artist career with LOST MUSIC.",
    url: "https://lostmusic.collective", // Placeholder, user can update
    siteName: "LOST MUSIC",
    images: [
      {
        url: "/og-image.jpg", // User should add this to public/
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOST MUSIC | Next-Gen Artist Portal",
    description: "Join the collective. Submit your demos now.",
    images: ["/og-image.jpg"],
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <SmoothScroll />
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
