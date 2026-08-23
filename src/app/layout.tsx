import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import LayoutWrapper from "@/components/layout-wrapper";
import SmoothScroll from "@/components/SmoothScroll";
import { Analytics } from "@vercel/analytics/react";
import { SecurityGuard } from "@/components/SecurityGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CronoBash — High-Stakes Focus Arena & Deep Work Protocol",
    template: "%s | CronoBash",
  },
  description: "CronoBash is the next-gen AI focus arena. Compete in 1v1 focus duels, track real-time eye-gaze telemetry, join squad study chambers, and build indestructible flow-state habits.",
  keywords: [
    "CronoBash",
    "cronobash.com",
    "focus arena",
    "deep work protocol",
    "1v1 focus duels",
    "study gamification",
    "gaze tracking timer",
    "squad study rooms",
    "AI focus coach",
  ],
  icons: {
    icon: [
      { url: '/favicon.ico?v=4' },
      { url: '/icon.png?v=4', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=4',
    apple: '/favicon.ico?v=4',
  },
  authors: [{ name: "CronoBash Team", url: "https://cronobash.com" }],
  creator: "CronoBash Inc.",
  publisher: "CronoBash Inc.",
  metadataBase: new URL('https://cronobash.com'),
  alternates: {
    canonical: 'https://cronobash.com',
  },
  openGraph: {
    title: "CronoBash — High-Stakes Focus Arena & Deep Work Protocol",
    description: "Turn deep work into a sport. Compete in 1v1 focus duels, track AI distraction telemetry, and level up with your squad on cronobash.com.",
    url: 'https://cronobash.com',
    siteName: 'CronoBash',
    images: [
      {
        url: '/hero-poster.webp',
        width: 1920,
        height: 1080,
        alt: 'CronoBash High-Stakes Focus Arena',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CronoBash — High-Stakes Focus Arena & Deep Work Protocol",
    description: "Turn deep work into a sport. Compete in 1v1 focus duels and level up on cronobash.com.",
    images: ['/hero-poster.webp'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CronoBash',
    alternateName: 'CronoBash Focus Arena',
    url: 'https://cronobash.com',
    description: 'CronoBash is the high-stakes AI focus arena & deep work protocol.',
    publisher: {
      '@type': 'Organization',
      name: 'CronoBash Inc.',
      url: 'https://cronobash.com',
      logo: 'https://cronobash.com/favicon.ico',
    },
  };

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="icon" href="/favicon.ico?v=4" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=4" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Special+Elite&family=Geist:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && Element.prototype.releasePointerCapture) {
                var origRelease = Element.prototype.releasePointerCapture;
                Element.prototype.releasePointerCapture = function(id) {
                  try {
                    if (this.hasPointerCapture && this.hasPointerCapture(id)) {
                      origRelease.call(this, id);
                    }
                  } catch (e) {}
                };
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#ECEFF6] text-[#0F172A] font-sans antialiased">
        <AuthProvider>
          <SecurityGuard />
          <SmoothScroll>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SmoothScroll>
        </AuthProvider>
        <Analytics debug={false} />
      </body>
    </html>
  );
}
