"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import Header from './header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Route groups where the global sidebar & header are hidden
  const hideLayoutRoutes = ['/', '/login', '/signup', '/onboarding', '/study'];
  const hideLayout = hideLayoutRoutes.includes(pathname) || pathname.startsWith('/study/');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
      {/* Sidebar - fixed left width 72 (288px) */}
      <Sidebar />

      {/* Main Canvas frame */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <Header />
        
        {/* Page contents */}
        <main className="flex-grow pt-20 md:pt-6 pb-12 px-4 md:px-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
