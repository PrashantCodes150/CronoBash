"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Coins, Sparkles } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();

  return (
    <div className="w-full py-8 px-4 select-none relative overflow-y-auto max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Full-Page Center Card */}
      <div className="w-full max-w-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-surface-container border border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 md:space-y-8 shadow-[0_0_40px_rgba(245,158,11,0.2)] relative z-10 backdrop-blur-xl">
        
        {/* Top Header Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-pulse">
            <Coins className="w-8 h-8 animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-400 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            OFFICIAL FEATURE PREVIEW
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-white bg-clip-text text-transparent">
            Wallet Balance &amp; Token Recharge
          </h1>
          <p className="text-xs sm:text-sm text-amber-300/80 font-mono max-w-md mx-auto leading-relaxed">
            Master cognitive discipline, eliminate distractions, and stake your focus in 1v1 skill-verified study duels.
          </p>
        </div>

        {/* Large Ripped Paper / Metallic 3D Silver "COMING SOON" Graphic Container */}
        <div className="w-full max-w-lg mx-auto bg-neutral-950 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl p-0.5 select-none">
          <div className="py-8 sm:py-10 px-6 sm:px-10 flex items-center justify-center bg-gradient-to-r from-neutral-950 via-amber-950/40 to-neutral-950 relative">
            {/* Curled / Ripped White Paper Fold Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-r from-neutral-100 via-neutral-300 to-transparent shadow-[4px_0_12px_rgba(0,0,0,0.8)] transform -skew-x-6 border-r border-neutral-400 pointer-events-none z-20" />
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-3 bg-gradient-to-r from-neutral-400 to-transparent opacity-40 z-20 pointer-events-none" />

            {/* Metallic 3D Silver "COMING SOON" Typography */}
            <div className="relative z-10 text-center font-black tracking-widest uppercase font-display">
              <span className="block text-3xl sm:text-4xl md:text-5xl bg-gradient-to-b from-amber-300 via-orange-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]">
                COMING SOON
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 tracking-widest mt-2 block">
                REAL-MONEY ESCROW &amp; TOKEN RECHARGE GATEWAY
              </span>
            </div>
          </div>
        </div>

        {/* Trust-Building Notice */}
        <div className="bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl p-5 text-left space-y-1.5 max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Skill-Verified Cognitive Escrow Standard</span>
          </div>
          <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
            Transactions and token recharges are being calibrated for full Razorpay escrow integration with PostgreSQL <span className="text-white font-bold">SECURITY DEFINER</span> database ledgers.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-mono text-xs font-extrabold px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Control Center
          </button>
        </div>

      </div>
    </div>
  );
}
