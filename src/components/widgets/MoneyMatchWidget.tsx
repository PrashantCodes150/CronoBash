"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Sparkles, ArrowRight, Lock, BookOpen } from 'lucide-react';

export function MoneyMatchWidget() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push('/rooms')}
      className="card-base p-4 flex flex-col justify-between h-full bg-white border border-[#E5E5E3] hover:border-[#FF5A1F] transition-all cursor-pointer relative overflow-hidden group select-none shadow-sm rounded-2xl"
    >
      <div className="space-y-3 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FCE8E6] border border-[#FF5A1F]/30 flex items-center justify-center text-[#E04D14]">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0C0C] text-sm font-sans flex items-center gap-1">
                <span>Money Matches</span>
                <Lock className="w-3 h-3 text-[#FF5A1F]" />
              </h3>
              <p className="text-[10px] text-[#70706F] font-mono">1v1 Cash Escrow Arenas</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#FCE8E6] border border-[#FF5A1F]/30 text-[#E04D14] px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5 text-[#FF5A1F]" />
            COMING SOON
          </span>
        </div>

        {/* Info Description */}
        <p className="text-[11px] text-[#70706F] leading-relaxed font-mono">
          Stake focus tokens in 1v1 skill-verified study duels powered by behavioral economics &amp; Yerkes-Dodson arousal laws.
        </p>

        {/* Read More / Our Vision Action Link */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push('/money-matches-vision');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#FCE8E6] hover:bg-[#FCE8E6]/80 border border-[#FF5A1F]/30 text-[#E04D14] font-bold rounded-lg text-[10px] font-mono transition cursor-pointer"
        >
          <BookOpen className="w-3 h-3" />
          <span>Read More: Our Vision &amp; Science →</span>
        </button>
      </div>

      {/* Footer CTA */}
      <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E3] text-[10px] font-mono text-[#FF5A1F] font-bold transition-colors">
        <span>View Arenas</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
