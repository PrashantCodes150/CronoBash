"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './header';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideLayoutRoutes = ['/', '/login', '/signup', '/onboarding'];
  const hideLayout = hideLayoutRoutes.includes(pathname) || pathname.startsWith('/study/');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#ECEFF6] text-[#0F172A] selection:bg-[#3B82F6] selection:text-white font-sans antialiased">
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <Header />

        {/* Page contents */}
        <main className="flex-grow pt-2 sm:pt-4 pb-12 px-3 sm:px-4 md:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>

        {/* Footer (Only on Legal Policy Pages) */}
        {['/terms', '/privacy', '/refund', '/legal'].includes(pathname) && <Footer />}
      </div>
    </div>
  );
}
