"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, ArrowLeft } from 'lucide-react';

export default function MarketplacePage() {
  const router = useRouter();

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8">
      
      {/* SINGLE CLEAN STUNNING COMING SOON BANNER CARD WITH FRAMER MOTION ANIMATION */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="morphism-card bg-white p-8 sm:p-12 md:p-16 rounded-[32px] border border-white/80 shadow-sm max-w-2xl w-full mx-auto text-center space-y-6 relative overflow-hidden select-none"
      >
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Icon Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-[#9333EA] flex items-center justify-center shadow-xs">
            <Store className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-[#9333EA] px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#9333EA] animate-ping"></span>
            <span>Focus Arena Cosmetics &amp; Themes</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            COMING SOON
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Custom room themes, ambient soundscapes, and avatar borders are currently being calibrated. Launching shortly!
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-3.5 px-8 rounded-full transition-transform hover:scale-105 cursor-pointer shadow-md flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Control Center</span>
          </button>
        </div>

      </motion.div>

    </div>
  );
}
