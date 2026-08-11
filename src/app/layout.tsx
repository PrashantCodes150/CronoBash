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
  title: "CronoBash — Where focus becomes a game.",
  description: "Join 1v1 focus duels, track AI distraction telemetry, climb global leaderboards, and build daily study habits with your squad.",
  metadataBase: new URL('https://cronobash.vercel.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
