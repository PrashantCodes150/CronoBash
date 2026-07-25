"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Sparkles, ArrowRight, Lock, BookOpen } from 'lucide-react';

export function MoneyMatchWidget() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push('/rooms')}
      className="card-base p-4 flex flex-col justify-between h-full bg-surface-container/80 border border-outline-variant/40 hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden group select-none shadow-lg"
    >
      {/* Background Subtle Amber Glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -translate-y-8 translate-x-8 group-hover:bg-amber-500/20 transition-all duration-500" />

      <div className="space-y-3 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-display flex items-center gap-1">
                <span>Money Matches</span>
                <Lock className="w-3 h-3 text-amber-400" />
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono">1v1 Cash Escrow Arenas</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            COMING SOON
          </span>
        </div>

        {/* Info Description */}
        <p className="text-[11px] text-on-surface-variant leading-relaxed font-mono">
          Stake focus tokens in 1v1 skill-verified study duels powered by behavioral economics & Yerkes-Dodson arousal laws.
        </p>

        {/* Read More / Our Vision Action Link */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push('/money-matches-vision');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-[10px] font-mono transition cursor-pointer"
        >
          <BookOpen className="w-3 h-3" />
          <span>Read More: Our Vision & Science →</span>
        </button>
      </div>

      {/* Footer CTA */}
      <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20 text-[10px] font-mono text-amber-400 font-bold group-hover:text-amber-300 transition-colors">
        <span>View Arenas</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
