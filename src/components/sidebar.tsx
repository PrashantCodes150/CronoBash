"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Rooms', href: '/rooms', icon: 'groups' },
    { name: 'Challenges', href: '/challenges', icon: 'sports_esports' },
    { name: 'Arena', href: '/arena', icon: 'military_tech' },
    { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
    { name: 'Tasks', href: '/tasks', icon: 'checklist' },
    { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
    { name: 'Profile', href: '/profile', icon: 'person' },
    { name: 'Settings', href: '/settings', icon: 'settings' }
  ];

  return (
    <nav className="hidden md:flex bg-surface-container border-r border-outline-variant fixed left-0 top-0 h-full w-72 flex-col p-4 z-40">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-4 px-2">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-container/20 border border-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-container text-2xl font-bold">bolt</span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-black text-primary-fixed leading-tight select-none">
            FocusArena
          </h1>
          <p className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            System Online
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 flex-grow">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-label-mono text-label-mono transition-all duration-200 group ${
                  isActive
                    ? 'text-on-primary bg-primary-container font-bold shadow-[0_0_15px_rgba(0,255,163,0.25)] translate-x-1'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    isActive ? 'text-on-primary' : 'text-on-surface-variant group-hover:text-primary-fixed'
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Action and User Profile bottom section */}
      <div className="mt-auto pt-4 flex flex-col gap-4 border-t border-outline-variant/30">
        <button
          onClick={() => router.push('/study')}
          className="w-full bg-primary-container text-on-primary-fixed font-bold py-3 rounded-lg hover:bg-primary-fixed transition-colors font-label-mono text-label-mono flex justify-center items-center gap-2 glow-primary select-none cursor-pointer"
        >
          <span className="material-symbols-outlined font-bold">play_arrow</span>
          Start Focus Sprint
        </button>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-variant flex-shrink-0">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-label-mono text-label-mono text-on-surface font-bold truncate max-w-[100px]">
                  {profile?.name || 'Arena Fighter'}
                </span>
                {user?.user_metadata?.is_pro === true && (
                  <span className="text-[7px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shrink-0 shadow-[0_0_5px_rgba(234,179,8,0.2)]">
                    PRO
                  </span>
                )}
              </div>
              <p className="font-label-mono text-[10px] text-on-surface-variant">
                Target: {profile?.daily_goal_minutes || 120} min
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-surface-variant"
            title="Log Out"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
