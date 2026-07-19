"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    const savedTheme = 'dark';
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const themeClasses = ['theme-dark', 'theme-pink', 'theme-green', 'theme-water'];
    themeClasses.forEach(cls => {
      htmlEl.classList.remove(cls);
      bodyEl.classList.remove(cls);
    });

    htmlEl.classList.add(`theme-${savedTheme}`);
    bodyEl.classList.add(`theme-${savedTheme}`);
  }, [pathname]);

  // Route groups where the global sidebar & header are hidden
  const hideLayoutRoutes = ['/', '/login', '/signup', '/onboarding', '/study'];
  const hideLayout = hideLayoutRoutes.includes(pathname) || pathname.startsWith('/study/');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
      {/* Main Canvas frame — full screen without sidebar */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <Header />

        {/* Page contents */}
        <main className="flex-grow pt-4 pb-12 px-4 md:px-8 w-full max-w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
