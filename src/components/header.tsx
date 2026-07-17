"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, wallet, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hidden on root landing and auth pages for layout simplicity
  const authRoutes = ['/', '/login', '/signup', '/onboarding'];
  if (authRoutes.includes(pathname)) return null;

  return (
    <>
      {/* Desktop Top Header Bar */}
      <header className="hidden md:flex justify-between items-center h-16 px-8 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">
            Current Arena: <span className="text-primary-fixed font-bold">{pathname.split('/')[1]?.toUpperCase() || 'DASHBOARD'}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Wallet quick balance */}
          <Link href="/wallet" className="flex items-center gap-2.5 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-lg hover:border-primary-container transition-all">
            <span className="material-symbols-outlined text-primary-container text-sm font-bold">account_balance_wallet</span>
            <span className="font-label-mono text-xs text-on-surface-variant">Wallet:</span>
            <span className="font-label-mono text-sm text-primary-fixed font-bold">
              {wallet?.balance ?? 0} <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
            </span>
          </Link>

          {/* Go Pro trigger */}
          <button className="bg-primary-container/10 border border-primary-container/40 text-primary-fixed hover:bg-primary-container hover:text-on-primary transition-all px-4 py-1.5 rounded-lg font-label-mono text-xs font-bold cursor-pointer">
            Go Pro
          </button>

          {/* Notification Button */}
          <button className="text-on-surface-variant hover:text-primary-fixed transition-colors relative cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error"></span>
          </button>

          {/* Settings shortcut */}
          <button onClick={() => router.push('/settings')} className="text-on-surface-variant hover:text-primary-fixed transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>

          {/* User profile picture with dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-primary-fixed bg-surface-variant shrink-0 cursor-pointer focus:outline-none"
            >
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
              />
            </button>

            {dropdownOpen && (
              <>
                {/* Click outside overlay to close */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                
                <div className="absolute right-0 mt-2 w-56 bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-outline-variant/30 text-xs font-mono">
                    <p className="font-bold text-on-surface truncate">{profile?.name || 'Arena Fighter'}</p>
                    <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{profile?.email}</p>
                  </div>
                  <ul className="py-1 text-xs font-label-mono uppercase font-bold text-on-surface-variant space-y-1">
                    <li>
                      <Link 
                        href="/profile" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">person</span>
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-error-container/20 hover:text-error text-left transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center p-4 bg-surface-container border-b border-outline-variant fixed top-0 left-0 w-full z-50">
        <h1 className="font-headline-md text-headline-md font-black text-primary-fixed select-none">
          FocusArena
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/wallet" className="flex items-center gap-1 font-label-mono text-sm text-primary-fixed font-bold bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant">
            <span>{wallet?.balance ?? 0}</span>
            <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface hover:text-primary-fixed p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-45 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 bg-surface-container border-r border-outline-variant h-full p-4 flex flex-col pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-2 flex-grow">
              {[
                { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
                { name: 'Rooms', href: '/rooms', icon: 'groups' },
                { name: 'Challenges', href: '/challenges', icon: 'sports_esports' },
                { name: 'Arena', href: '/arena', icon: 'military_tech' },
                { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
                { name: 'Tasks', href: '/tasks', icon: 'checklist' },
                { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
                { name: 'Profile', href: '/profile', icon: 'person' },
                { name: 'Settings', href: '/settings', icon: 'settings' }
              ].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg font-label-mono text-label-mono ${
                        isActive
                          ? 'text-on-primary bg-primary-container font-bold'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined">{link.icon}</span>
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto flex flex-col gap-4 border-t border-outline-variant/30 pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/study');
                }}
                className="w-full bg-primary-container text-on-primary font-bold py-3 rounded-lg font-label-mono text-label-mono flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Start Sprint
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full border border-outline-variant hover:border-error text-on-surface hover:text-error py-2.5 rounded-lg font-label-mono text-xs flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
