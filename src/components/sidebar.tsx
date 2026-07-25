"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Buddies', href: '/buddies', icon: 'person_add' },
    { name: 'Arenas', href: '/rooms', icon: 'groups' },
    { name: 'Tasks', href: '/tasks', icon: 'checklist' },
    { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
    { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
    { name: 'Store', href: '/marketplace', icon: 'storefront' },
    { name: 'Profile', href: '/profile', icon: 'person' },
    { name: 'Settings', href: '/settings', icon: 'settings' }
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.nav
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-surface-container border-r border-outline-variant fixed left-0 top-0 h-full w-72 flex flex-col p-4 z-40"
      >
        {/* Brand Header + Close button */}
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center group cursor-pointer select-none no-underline w-56 shrink-0">
            <div className="font-display text-xl font-medium tracking-wide flex items-center text-primary-fixed">
              <span className="font-dancing text-2xl md:text-3xl font-bold italic select-none">C</span>
              <span className="text-on-surface">rono</span>
              <span className="font-dancing text-2xl md:text-3xl font-bold italic select-none">B</span>
              <span className="text-on-surface">ash</span>
            </div>
          </Link>

          {/* Close / collapse button */}
          <button
            onClick={onClose}
            title="Collapse sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-1 flex-grow">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-label-mono text-label-mono transition-all duration-300 group ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-emerald-500/25 via-cyan-500/15 to-transparent border-l-4 border-emerald-400 font-bold shadow-[0_0_15px_rgba(0,255,163,0.2)] translate-x-1'
                      : 'text-on-surface-variant hover:text-white hover:bg-surface-variant/60 hover:translate-x-1'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 ${
                      isActive ? 'text-emerald-400 animate-pulse' : 'text-on-surface-variant group-hover:text-cyan-400 group-hover:scale-110'
                    }`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {link.icon}
                  </span>
                  <span className="group-hover:tracking-wide transition-all">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Action and User Profile bottom section */}
        <div className="mt-auto pt-4 flex flex-col gap-4 border-t border-outline-variant/30">
          <button
            onClick={() => { router.push('/study'); onClose(); }}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-bold py-3 rounded-xl transition-all duration-300 font-label-mono text-label-mono flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:scale-[1.02] cursor-pointer group"
          >
            <span className="material-symbols-outlined font-bold group-hover:translate-x-0.5 transition-transform">play_arrow</span>
            <span>Start Focus Sprint</span>
          </button>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 flex-shrink-0 shadow-[0_0_10px_rgba(0,255,163,0.3)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-container">
                  <img
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-label-mono text-label-mono text-white font-bold truncate max-w-[100px]">
                    {profile?.name || 'Arena Fighter'}
                  </span>
                </div>
                <p className="font-label-mono text-[10px] text-emerald-400 font-semibold">
                  Target: {profile?.daily_goal_minutes || 120} min
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-on-surface-variant hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-500/10 cursor-pointer"
              title="Log Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
