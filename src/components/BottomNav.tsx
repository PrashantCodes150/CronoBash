"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';
import { BADGES } from '@/lib/badges';

const tabs = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', activeIcon: 'dashboard' },
  { name: 'Sprints', href: '/study', icon: 'timer', activeIcon: 'timer' },
  { name: 'Arenas', href: '/rooms', icon: 'groups', activeIcon: 'groups' },
  { name: 'Tasks', href: '/tasks', icon: 'checklist', activeIcon: 'checklist' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const hiddenRoutes = ['/', '/login', '/signup', '/onboarding'];
  if (hiddenRoutes.includes(pathname) || pathname.startsWith('/study')) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom" role="navigation" aria-label="Mobile navigation">
      <div
        className="mx-2 mb-2 rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)' }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
                  isActive ? 'text-[#3B82F6]' : 'text-slate-400'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] leading-none transition-all duration-200 ${
                    isActive ? 'font-variation-settings-[\'FILL\'_1]' : ''
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
                  {tab.name}
                </span>
                {isActive && (
                  <span className="w-5 h-0.5 rounded-full bg-[#3B82F6] mt-0.5" />
                )}
              </Link>
            );
          })}

          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
              pathname === '/profile' ? 'text-[#3B82F6]' : 'text-slate-400'
            }`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current p-px">
              <img
                alt=""
                className="w-full h-full object-cover rounded-full"
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
              />
            </div>
            <span className={`text-[10px] font-bold leading-tight ${pathname === '/profile' ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
              Profile
            </span>
            {pathname === '/profile' && (
              <span className="w-5 h-0.5 rounded-full bg-[#3B82F6] mt-0.5" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
