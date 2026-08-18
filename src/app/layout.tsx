import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import LayoutWrapper from "@/components/layout-wrapper";
import SmoothScroll from "@/components/SmoothScroll";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CronoBash — Gamified Study Arena & Focus Duels",
    template: "%s | CronoBash",
  },
  description: "CronoBash is the ultimate gamified focus arena. Challenge study squads in 1v1 duels, earn XP rewards, monitor AI focus telemetry, and build indestructible study habits.",
  keywords: [
    "CronoBash",
    "cronobash.com",
    "focus arena",
    "study gamification",
    "1v1 focus duels",
    "study timer",
    "pomodoro duel",
    "squad study rooms",
    "AI focus coach",
  ],
  authors: [{ name: "CronoBash Team", url: "https://cronobash.com" }],
  creator: "CronoBash Inc.",
  publisher: "CronoBash Inc.",
  metadataBase: new URL('https://cronobash.com'),
  alternates: {
    canonical: 'https://cronobash.com',
  },
  openGraph: {
    title: "CronoBash — Gamified Study Arena & Focus Duels",
    description: "Turn study into a sport. Compete in 1v1 focus duels, track AI distraction telemetry, and level up with your squad on cronobash.com.",
    url: 'https://cronobash.com',
    siteName: 'CronoBash',
    images: [
      {
        url: '/hero-poster.webp',
        width: 1920,
        height: 1080,
        alt: 'CronoBash Gamified Study Arena',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CronoBash — Gamified Study Arena & Focus Duels",
    description: "Turn study into a sport. Compete in 1v1 focus duels and level up on cronobash.com.",
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
    description: 'Gamified focus arena where studying becomes a sport. 1v1 duels, study squads, and AI focus tracking.',
    publisher: {
      '@type': 'Organization',
      name: 'CronoBash Inc.',
      url: 'https://cronobash.com',
      logo: 'https://cronobash.com/cronobash-logo-full.png',
    },
  };

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
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
          <SmoothScroll>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SmoothScroll>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
