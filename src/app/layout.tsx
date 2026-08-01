import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import LayoutWrapper from "@/components/layout-wrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CronoBash — Study with Friends, Compete Globally",
  description: "Join 1v1 study battles, track focus with AI, climb leaderboards, and earn rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.className} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/hero-frames/frame_001.webp" as="image" type="image/webp" />
        <link rel="preload" href="/cronobash-icon.webp" as="image" type="image/webp" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Archivo:wght@400;500;600;700;800;900&family=Azeret+Mono:wght@400;500;600;700&family=Fragment+Mono&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Edu+NSW+ACT+Cursive:wght@400..700&family=Playwrite+AR+Guides&family=Playwrite+DE+SAS:wght@100..400&display=swap"
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
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
