"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#070B14] text-slate-400 border-t border-slate-800/80 pt-16 pb-12 px-6 sm:px-12 relative overflow-hidden z-30 font-sans">
      
      {/* Ambient soft glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF5500]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Top Section: Brand + Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center group cursor-pointer select-none no-underline">
              <div className="font-sans text-2xl font-black tracking-tight flex items-center">
                <span className="text-white">CRONO</span>
                <span className="text-[#FF5500]">BASH</span>
                <span className="text-[#FF5500]">.</span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-sm">
              The multiplayer focus arena where study sprints, squad rooms, cash stakes, and duels keep your momentum unstoppable.
            </p>

          </div>

          {/* Nav Grid (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Col 1: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="/arena" className="hover:text-[#FF5500] transition-colors">1v1 Focus Arenas</Link>
                </li>
                <li>
                  <Link href="/rooms" className="hover:text-[#FF5500] transition-colors">Squad Rooms</Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-[#FF5500] transition-colors">Global Leaderboard</Link>
                </li>
                <li>
                  <Link href="/ai-coach" className="hover:text-[#FF5500] transition-colors">AI Focus Coach</Link>
                </li>
                <li>
                  <Link href="/tasks" className="hover:text-[#FF5500] transition-colors">Task Management</Link>
                </li>
              </ul>
            </div>

            {/* Col 2: Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Features</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="/money-matches-vision" className="hover:text-[#FF5500] transition-colors">Money Matches</Link>
                </li>
                <li>
                  <Link href="/analytics" className="hover:text-[#FF5500] transition-colors">Analytics & Insights</Link>
                </li>
                <li>
                  <Link href="/daily-challenges" className="hover:text-[#FF5500] transition-colors">Daily Quests</Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-[#FF5500] transition-colors">Item Marketplace</Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-[#FF5500] transition-colors">Wallet & Rewards</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Support */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal & Support</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="/terms" className="hover:text-[#FF5500] transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#FF5500] transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-[#FF5500] transition-colors">Refund & Cancellation</Link>
                </li>
                <li>
                  <Link href="/legal" className="hover:text-[#FF5500] transition-colors">Legal Disclaimers</Link>
                </li>
                <li>
                  <a href="mailto:support@cronobash.com" className="hover:text-[#FF5500] transition-colors">Support Email</a>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div>
            © CronoBash Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-slate-400 text-xs">
            <Link href="/terms" className="hover:text-[#FF5500] transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#FF5500] transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-[#FF5500] transition-colors">
              Refunds
            </Link>
            <span>•</span>
            <Link href="/legal" className="hover:text-[#FF5500] transition-colors">
              Legal
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
