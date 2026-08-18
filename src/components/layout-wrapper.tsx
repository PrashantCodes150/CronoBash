"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import Header from './header';
import Footer from './Footer';
import LogoLoader from './LogoLoader';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const publicRoutes = ['/', '/login', '/signup', '/terms', '/privacy', '/refund', '/legal'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const hideLayoutRoutes = ['/', '/login', '/signup', '/onboarding'];
  const hideLayout = hideLayoutRoutes.includes(pathname) || pathname.startsWith('/study');

  // Strict Zero-Leak Security Guard:
  // 1. For any protected route, BEFORE client mounts or WHILE session is loading or IF user is unauthenticated:
  // NEVER render protected page HTML/DOM (prevents SSR pre-rendering leaks and hydration flashes).
  if (!isPublicRoute) {
    if (!mounted || loading || !user) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
          <LogoLoader size="md" text="VERIFYING SECURE SESSION..." />
        </div>
      );
    }
  }

  // 2. Strict Onboarding Shield:
  // If user is authenticated but HAS NOT COMPLETED ONBOARDING, NEVER render any non-onboarding page HTML/DOM.
  if (user && profile && profile.has_seen_onboarding === false && pathname !== '/onboarding') {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
        <LogoLoader size="md" text="PREPARING YOUR ONBOARDING ARENA..." />
      </div>
    );
  }

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
